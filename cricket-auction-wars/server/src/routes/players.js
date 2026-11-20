const router = require("express").Router();
const Player = require("../models/Player");
const auth = require("../middleware/auth");
router.get("/", auth, async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: search, $options: "i" };
  res.json(await Player.find(filter).sort({ name: 1 }));
});
module.exports = router;
