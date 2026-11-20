
const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const Player = require("../models/Player");

const BID_DURATION = 30 * 1000;
const RESULT_DURATION = 3 * 1000;
const NEXT_PLAYER_DURATION = 5 * 1000;

module.exports = function registerAuctionHandlers(io) {
  const timers = new Map();
  const roomLocks = new Map();

  async function withRoomLock(code, operation) {
    const previous = roomLocks.get(code) || Promise.resolve();

    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });

    roomLocks.set(code, current);
    await previous;

    try {
      return await operation();
    } finally {
      release();

      if (roomLocks.get(code) === current) {
        roomLocks.delete(code);
      }
    }
  }

  async function roomSnapshot(code) {
    return Room.findOne({ code })
      .populate("members.user", "name email")
      .populate("members.squad")
      .populate("currentPlayer")
      .populate("soldPlayers.player")
      .populate("unsoldPlayers");
  }

  async function broadcast(code) {
    const room = await roomSnapshot(code);

    if (room) {
      io.to(code).emit("auction:state", room);
    }
  }

  function clearRoomTimer(code) {
    if (timers.has(code)) {
      clearTimeout(timers.get(code));
      timers.delete(code);
    }
  }

  function schedule(code, delay) {
    clearRoomTimer(code);

    const timer = setTimeout(() => {
      advanceAuction(code).catch((error) => {
        console.error("Auction transition error:", error);
      });
    }, Math.max(0, delay));

    timers.set(code, timer);
  }

  async function advanceAuction(code) {
    return withRoomLock(code, async () => {
      const room = await Room.findOne({ code });

      if (!room || room.status !== "live" || !room.endsAt) {
        clearRoomTimer(code);
        return;
      }

      const remaining = room.endsAt.getTime() - Date.now();

      if (remaining > 0) {
        schedule(code, remaining);
        return;
      }

      // Finish the current player's bidding.
      if (room.phase === "bidding") {
        const playerId = room.currentPlayer;

        if (!playerId) {
          room.status = "completed";
          room.phase = "completed";
          room.endsAt = null;
          await room.save();
          await broadcast(code);
          clearRoomTimer(code);
          return;
        }

        if (room.highestBidder) {
          const member = room.members.find(
            (m) => String(m.user) === String(room.highestBidder)
          );

          if (member && member.budget >= room.currentBid) {
            member.budget = Number(
              (member.budget - room.currentBid).toFixed(2)
            );

            member.squad.push(playerId);

            room.soldPlayers.push({
              player: playerId,
              teamUser: member.user,
              price: room.currentBid
            });

            // Remove from unsold list if this player was sold
            // during the final unsold-player round.
            room.unsoldPlayers = room.unsoldPlayers.filter(
              (id) => String(id) !== String(playerId)
            );

            room.lastResult = "SOLD";
            room.lastSoldPrice = room.currentBid;
            room.lastWinner = member.user;
            room.lastWinnerTeamName = member.teamName;
          } else {
            room.lastResult = "UNSOLD";
            room.lastSoldPrice = null;
            room.lastWinner = null;
            room.lastWinnerTeamName = null;

            if (!room.unsoldPlayers.some(
              (id) => String(id) === String(playerId)
            )) {
              room.unsoldPlayers.push(playerId);
            }
          }
        } else {
          room.lastResult = "UNSOLD";
          room.lastSoldPrice = null;
          room.lastWinner = null;
          room.lastWinnerTeamName = null;

          if (!room.unsoldPlayers.some(
            (id) => String(id) === String(playerId)
          )) {
            room.unsoldPlayers.push(playerId);
          }
        }

        room.phase = "result";
        room.endsAt = new Date(Date.now() + RESULT_DURATION);

        await room.save();
        await broadcast(code);
        schedule(code, RESULT_DURATION);
        return;
      }

      // Show SOLD / UNSOLD for three seconds, then transition.
      if (room.phase === "result") {
        room.phase = "next_player";
        room.currentPlayer = null;
        room.endsAt = new Date(Date.now() + NEXT_PLAYER_DURATION);

        await room.save();
        await broadcast(code);
        schedule(code, NEXT_PLAYER_DURATION);
        return;
      }

      // Load the next player, or append unsold players once.
      if (room.phase === "next_player") {
        let nextIndex = room.currentIndex + 1;

        if (nextIndex >= room.playerPool.length) {
          if (!room.unsoldReauctioned && room.unsoldPlayers.length > 0) {
            const alreadyInPool = new Set(
              room.playerPool.map((id) => String(id))
            );

            const reauctionPlayers = room.unsoldPlayers.filter(
              (id) => !alreadyInPool.has(String(id))
            );

            room.playerPool.push(...reauctionPlayers);
            room.unsoldReauctioned = true;
          } else {
            room.status = "completed";
            room.phase = "completed";
            room.currentPlayer = null;
            room.endsAt = null;

            await room.save();
            await broadcast(code);
            clearRoomTimer(code);
            return;
          }
        }

        nextIndex = room.currentIndex + 1;

        const nextPlayerId = room.playerPool[nextIndex];
        const nextPlayer = await Player.findById(nextPlayerId);

        if (!nextPlayer) {
          room.status = "completed";
          room.phase = "completed";
          room.currentPlayer = null;
          room.endsAt = null;

          await room.save();
          await broadcast(code);
          clearRoomTimer(code);
          return;
        }

        room.currentIndex = nextIndex;
        room.currentPlayer = nextPlayer._id;
        room.currentBid = nextPlayer.basePrice;
        room.highestBidder = null;
        room.lastResult = null;
        room.lastSoldPrice = null;
        room.lastWinner = null;
        room.lastWinnerTeamName = null;
        room.phase = "bidding";
        room.endsAt = new Date(Date.now() + BID_DURATION);

        await room.save();
        await broadcast(code);
        schedule(code, BID_DURATION);
      }
    });
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  const watchdog = setInterval(async () => {
    try {
      const expiredRooms = await Room.find({
        status: "live",
        endsAt: { $lte: new Date() }
      }).select("code");

      for (const room of expiredRooms) {
        await advanceAuction(room.code);
      }
    } catch (error) {
      console.error("Auction timer check failed:", error.message);
    }
  }, 1000);

  if (watchdog.unref) watchdog.unref();

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ code }) => {
      try {
        const roomCode = String(code || "").toUpperCase();
        const room = await Room.findOne({ code: roomCode });

        if (
          !room ||
          !room.members.some(
            (member) => String(member.user) === socket.userId
          )
        ) {
          return socket.emit(
            "auction:error",
            "You are not a member of this room"
          );
        }

        socket.join(roomCode);

        const snapshot = await roomSnapshot(roomCode);
        socket.emit("auction:state", snapshot);

        if (room.status === "live" && room.endsAt) {
          schedule(
            roomCode,
            room.endsAt.getTime() - Date.now()
          );
        }
      } catch (error) {
        socket.emit("auction:error", "Could not join room");
      }
    });

    socket.on("auction:bid", async ({ code, amount }, ack = () => {}) => {
      const roomCode = String(code || "").toUpperCase();

      try {
        const result = await withRoomLock(roomCode, async () => {
          const room = await Room.findOne({ code: roomCode });

          if (
            !room ||
            room.status !== "live" ||
            room.phase !== "bidding" ||
            !room.currentPlayer
          ) {
            return {
              ok: false,
              message: "Bidding is not currently open"
            };
          }

          if (!room.endsAt || room.endsAt.getTime() <= Date.now()) {
            return {
              ok: false,
              message: "Bidding time has ended"
            };
          }

          const member = room.members.find(
            (m) => String(m.user) === socket.userId
          );

          if (!member) {
            return {
              ok: false,
              message: "You are not in this room"
            };
          }

          if (String(room.highestBidder) === socket.userId) {
            return {
              ok: false,
              message: "You already have the highest bid"
            };
          }

          const bid = Number(amount);
          const minimum = Number(
            (room.currentBid + 0.5).toFixed(2)
          );

          if (!Number.isFinite(bid) || bid < minimum) {
            return {
              ok: false,
              message: `Minimum next bid is ${minimum} crore`
            };
          }

          if (bid > member.budget) {
            return {
              ok: false,
              message: "Insufficient budget"
            };
          }

          room.currentBid = bid;
          room.highestBidder = member.user;
          room.endsAt = new Date(Date.now() + BID_DURATION);

          await room.save();

          return { ok: true };
        });

        ack(result);

        if (result.ok) {
          await broadcast(roomCode);

          const updatedRoom = await Room.findOne({ code: roomCode });

          if (updatedRoom?.endsAt) {
            schedule(
              roomCode,
              updatedRoom.endsAt.getTime() - Date.now()
            );
          }
        }
      } catch (error) {
        console.error("Bid error:", error);

        ack({
          ok: false,
          message: "Bid failed. Please try again."
        });
      }
    });
  });
};
