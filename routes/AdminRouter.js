const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../db/userModel");

// POST /admin/login — 7
router.post("/login", async (req, res) => {
  const { login_name, password } = req.body;
  if (!login_name || !password)
    return res.status(400).json({ error: "login_name and password required" });

  try {
    const user = await User.findOne({ login_name });
    if (!user)
      return res.status(400).json({ error: "Invalid login_name or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid login_name or password" });

    req.session.userId = user._id; // 7: req.session.userId = user.id
    res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/logout — 9
router.post("/logout", (req, res) => {
  if (!req.session.userId)
    return res.status(400).json({ error: "No user logged in" });

  req.session.destroy((err) => {
    // 9: req.session.destroy()
    if (err) return res.status(500).json({ error: "Error logging out" });
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
