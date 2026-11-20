const router = require("express").Router();
const auth = require("../middleware/auth");
const Room = require("../models/Room");
const evaluateRoom = require("../utils/evaluate");

router.get("/:code", auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate("members.user", "name").populate("members.squad");
    if (!room || !room.members.some(m => String(m.user._id) === String(req.user._id)))
      return res.status(404).json({ message: "Room not found" });
    if (room.status !== "completed") return res.status(400).json({ message: "Finish the auction first" });
    const rankings = evaluateRoom(room);
    if (!process.env.OPENAI_API_KEY) return res.json({ rankings, explanation: "AI explanation is not configured. The rankings above are calculated by the backend scoring algorithm." });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise cricket squad analyst. Explain the strengths, weaknesses and trade-offs using only the supplied scoring data. Do not change rankings or invent player facts." },
          { role: "user", content: JSON.stringify(rankings) }
        ],
        temperature: 0.4
      })
    });
    if (!response.ok) return res.json({ rankings, explanation: "AI service unavailable right now; the deterministic rankings are still available." });
    const data = await response.json();
    res.json({ rankings, explanation: data.choices?.[0]?.message?.content || "No explanation returned." });
  } catch { res.status(500).json({ message: "Could not evaluate teams" }); }
});
module.exports = router;
