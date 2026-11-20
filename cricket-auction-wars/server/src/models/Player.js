const mongoose = require("mongoose");
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["Batter", "Bowler", "All-rounder", "Wicketkeeper"], required: true },
  nationality: { type: String, default: "India" },
  isOverseas: { type: Boolean, default: false },
  batting: { type: Number, min: 1, max: 100, default: 60 },
  bowling: { type: Number, min: 1, max: 100, default: 30 },
  fielding: { type: Number, min: 1, max: 100, default: 60 },
  basePrice: { type: Number, min: 0.2, default: 0.5 }
}, { timestamps: true });
module.exports = mongoose.model("Player", playerSchema);
