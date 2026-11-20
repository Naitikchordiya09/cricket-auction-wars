
const router = require("express").Router();
const crypto = require("crypto");
const Room = require("../models/Room");
const Player = require("../models/Player");
const auth = require("../middleware/auth");

const BID_DURATION = 30 * 1000;

const code = () =>
  crypto.randomBytes(3).toString("hex").toUpperCase();

const categoryOrder = [
  "indian_bowler",
  "indian_batter",
  "indian_allrounder",
  "overseas_bowler",
  "overseas_batter",
  "overseas_allrounder"
];

function getPlayerCategory(player) {
  const nationality = String(player.nationality || "").toLowerCase();
  const role = String(player.role || "").toLowerCase();

  const overseas = nationality !== "india";

  let roleType = "batter";

  if (role.includes("all") || role.includes("round")) {
    roleType = "allrounder";
  } else if (role.includes("bowl")) {
    roleType = "bowler";
  }

  return `${overseas ? "overseas" : "indian"}_${roleType}`;
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(getPlayerCategory(a));
    const bIndex = categoryOrder.indexOf(getPlayerCategory(b));

    return aIndex - bIndex;
  });
}

const populateRoom = (query) =>
  query
    .populate("members.user", "name email")
    .populate("members.squad")
    .populate("currentPlayer")
    .populate("soldPlayers.player")
    .populate("unsoldPlayers");

router.post("/", auth, async (req, res) => {
  try {
    const teamName = (req.body.teamName || "").trim();

    if (!teamName) {
      return res.status(400).json({
        message: "Team name is required"
      });
    }

    const players = await Player.find();

    if (!players.length) {
      return res.status(400).json({
        message: "Player pool is empty. Run npm run seed."
      });
    }

    const orderedPlayers = sortPlayers(players);

    let roomCode = code();

    while (await Room.exists({ code: roomCode })) {
      roomCode = code();
    }

    const room = await Room.create({
      code: roomCode,
      host: req.user._id,
      phase: "waiting",
      members: [{
        user: req.user._id,
        teamName,
        budget: 100,
        squad: []
      }],
      playerPool: orderedPlayers.map((p) => p._id)
    });

    res.status(201).json(
      await populateRoom(Room.findById(room._id))
    );

  } catch (error) {
    res.status(500).json({
      message: "Could not create room",
      error: error.message
    });
  }
});

router.post("/:code/join", auth, async (req, res) => {
  try {
    const room = await Room.findOne({
      code: req.params.code.toUpperCase()
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== "waiting") {
      return res.status(400).json({
        message: "Auction already started"
      });
    }

    if (room.members.some(
      (m) => String(m.user) === String(req.user._id)
    )) {
      return res.json(
        await populateRoom(Room.findById(room._id))
      );
    }

    if (room.members.length >= 4) {
      return res.status(400).json({ message: "Room is full" });
    }

    const teamName = (req.body.teamName || "").trim();

    if (!teamName) {
      return res.status(400).json({
        message: "Team name is required"
      });
    }

    room.members.push({
      user: req.user._id,
      teamName,
      budget: 100,
      squad: []
    });

    await room.save();

    res.json(
      await populateRoom(Room.findById(room._id))
    );

  } catch (error) {
    res.status(500).json({
      message: "Could not join room",
      error: error.message
    });
  }
});

router.get("/:code", auth, async (req, res) => {
  try {
    const room = await populateRoom(
      Room.findOne({ code: req.params.code.toUpperCase() })
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some(
      (m) => String(m.user._id) === String(req.user._id)
    )) {
      return res.status(403).json({
        message: "Join this room first"
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({
      message: "Could not load room",
      error: error.message
    });
  }
});

router.post("/:code/start", auth, async (req, res) => {
  try {
    const room = await Room.findOne({
      code: req.params.code.toUpperCase()
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (String(room.host) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Only host can start"
      });
    }

    if (room.members.length !== 4) {
      return res.status(400).json({
        message: "Exactly four participants are required"
      });
    }

    if (room.status !== "waiting") {
      return res.status(400).json({
        message: "Room already started"
      });
    }

    const firstPlayer = await Player.findById(room.playerPool[0]);

    if (!firstPlayer) {
      return res.status(400).json({
        message: "First player not found"
      });
    }

    room.status = "live";
    room.phase = "bidding";
    room.currentIndex = 0;
    room.currentPlayer = firstPlayer._id;
    room.currentBid = firstPlayer.basePrice;
    room.highestBidder = null;
    room.lastResult = null;
    room.lastSoldPrice = null;
    room.lastWinner = null;
    room.lastWinnerTeamName = null;
    room.unsoldReauctioned = false;
    room.endsAt = new Date(Date.now() + BID_DURATION);

    await room.save();

    const io = req.app.get("io");

    io.to(room.code).emit(
      "auction:state",
      await populateRoom(Room.findById(room._id))
    );

    res.json({ message: "Auction started" });

  } catch (error) {
    res.status(500).json({
      message: "Could not start auction",
      error: error.message
    });
  }
});

router.get("/:code/results", auth, async (req, res) => {
  try {
    const room = await populateRoom(
      Room.findOne({ code: req.params.code.toUpperCase() })
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.some(
      (m) => String(m.user._id) === String(req.user._id)
    )) {
      return res.status(403).json({
        message: "Not a room member"
      });
    }

    if (room.status !== "completed") {
      return res.status(400).json({
        message: "Auction is not complete"
      });
    }

    const evaluateRoom = require("../utils/evaluate");

    res.json({ rankings: evaluateRoom(room) });

  } catch (error) {
    res.status(500).json({
      message: "Could not load results",
      error: error.message
    });
  }
});

module.exports = router;
