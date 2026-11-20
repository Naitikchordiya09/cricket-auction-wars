
const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  teamName: { type: String, required: true },
  budget: { type: Number, default: 100 },
  squad: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player"
  }]
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  members: {
    type: [memberSchema],
    default: []
  },

  status: {
    type: String,
    enum: ["waiting", "live", "completed"],
    default: "waiting"
  },

  phase: {
    type: String,
    enum: ["waiting", "bidding", "result", "next_player", "completed"],
    default: "waiting"
  },

  lastResult: {
    type: String,
    enum: ["SOLD", "UNSOLD", null],
    default: null
  },

  lastSoldPrice: {
    type: Number,
    default: null
  },

  lastWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  lastWinnerTeamName: {
    type: String,
    default: null
  },

  playerPool: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player"
  }],

  currentIndex: {
    type: Number,
    default: -1
  },

  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    default: null
  },

  currentBid: {
    type: Number,
    default: 0
  },

  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  endsAt: {
    type: Date,
    default: null
  },

  soldPlayers: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player"
    },
    teamUser: mongoose.Schema.Types.ObjectId,
    price: Number
  }],

  unsoldPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player"
  }],

  // Unsold players are added to the auction pool only once.
  unsoldReauctioned: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
