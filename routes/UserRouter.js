const express = require("express");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const Photo = require("../db/photoModel"); //extra
const router = express.Router();
const bcrypt = require("bcryptjs"); // FINAL

// GET /user/list
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/activity-stats  ← extra
// Trả về mảng { _id, photo_count, comment_count } cho tất cả user
router.get("/activity-stats", async (req, res) => {
  try {
    // Đếm ảnh theo user
    const photoCounts = await Photo.aggregate([
      { $group: { _id: "$user_id", photo_count: { $sum: 1 } } },
    ]);

    // Đếm comment theo tác giả (comment nhúng trong photo)
    const commentCounts = await Photo.aggregate([
      { $unwind: "$comments" },
      { $group: { _id: "$comments.user_id", comment_count: { $sum: 1 } } },
    ]);

    const users = await User.find({}, "_id");

    const photoMap = {};
    photoCounts.forEach((p) => {
      photoMap[p._id.toString()] = p.photo_count;
    });

    const commentMap = {};
    commentCounts.forEach((c) => {
      commentMap[c._id.toString()] = c.comment_count;
    });

    const stats = users.map((u) => ({
      _id: u._id,
      photo_count: photoMap[u._id.toString()] || 0,
      comment_count: commentMap[u._id.toString()] || 0,
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id/comments  ← extra
// Trả về tất cả comment của user kèm thông tin ảnh
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: `Invalid user id: ${id}` });

  try {
    const photos = await Photo.find({ "comments.user_id": id });

    const result = [];
    for (const photo of photos) {
      for (const comment of photo.comments) {
        if (comment.user_id.toString() === id) {
          result.push({
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            photo: {
              _id: photo._id,
              file_name: photo.file_name,
              date_time: photo.date_time,
              user_id: photo.user_id,
            },
          });
        }
      }
    }

    // ← FINAL: sort mới nhất trước
    result.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /user — register new user
router.post("/", async (req, res) => {
  const { login_name, password, first_name, last_name,
          location, description, occupation } = req.body;

  if (!login_name || !login_name.trim())
    return res.status(400).json({ error: "login_name is required" });
  if (!password || !password.trim())
    return res.status(400).json({ error: "password is required" });
  if (!first_name || !first_name.trim())
    return res.status(400).json({ error: "first_name is required" });
  if (!last_name || !last_name.trim())
    return res.status(400).json({ error: "last_name is required" });

  try {
    const existing = await User.findOne({ login_name });
    if (existing)
      return res.status(400).json({ error: "login_name already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await new User({
      login_name, password: hashed,
      first_name, last_name,
      location, description, occupation,
    }).save();

    res.json({ _id: user._id, login_name: user.login_name,
               first_name: user.first_name, last_name: user.last_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: `Invalid user id: ${id}` });
  }

  try {
    const user = await User.findById(
      id,
      "_id first_name last_name location description occupation",
    );
    if (!user) {
      return res.status(400).json({ error: `User ${id} not found` });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
