const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

console.log("DB_URL =", process.env.DB_URL);

async function dbConnect() {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => console.log("✅ Connected to MongoDB Atlas!"))
    .catch((err) => console.error("❌ Connection error:", err));
}

module.exports = dbConnect;
