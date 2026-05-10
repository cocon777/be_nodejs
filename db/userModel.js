const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  occupation: { type: String },
  login_name: { type: String, required: true, unique: true }, // ← FINAL
  password: { type: String, required: true }, // ← FINAL (Problem 4)
});

// Dùng pattern này để tránh lỗi "Cannot overwrite model once compiled"
// khi nodemon reload
module.exports = mongoose.models.Users || mongoose.model("Users", userSchema);
