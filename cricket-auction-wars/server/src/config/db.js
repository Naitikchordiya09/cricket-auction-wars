
const dns = require("dns");

// Workaround for DNS resolution issues
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");

async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
}

module.exports = connectDB;
