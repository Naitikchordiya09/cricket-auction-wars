require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const playerRoutes = require("./routes/players");
const roomRoutes = require("./routes/rooms");
const aiRoutes = require("./routes/ai");
const registerAuctionHandlers = require("./socket/auction");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET","POST"] } });
app.set("io", io);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ status: "ok", name: "Cricket Auction Wars API" }));
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ai-analysis", aiRoutes);
registerAuctionHandlers(io);

const PORT = process.env.PORT || 5000;
connectDB().then(() => server.listen(PORT, () => console.log(`API + Socket.IO running on ${PORT}`)))
  .catch(error => { console.error("Startup failed:", error.message); process.exit(1); });
