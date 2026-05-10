const express = require("express");
const mongoose = require("mongoose");
const multer   = require("multer");       // ← FINAL
const path     = require("path");         // ← FINAL
const fs       = require("fs");           // ← FINAL
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

//  config 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

//  GET /photo/:id 
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: `Invalid user id: ${id}` });

  try {
    const photos = await Photo.find({ user_id: id }).sort({ date_time: -1 });
    const result = await Promise.all(
      photos.map(async (photo) => {
        const sortedComments = [...photo.comments].sort(
          (a, b) => new Date(b.date_time) - new Date(a.date_time),
        );

        const comments = await Promise.all(
          sortedComments.map(async (c) => {
            const commentUser = await User.findById(
              c.user_id,
              "_id first_name last_name",
            );
            return {
              _id: c._id,
              comment: c.comment,
              date_time: c.date_time,
              user: commentUser,
            };
          }),
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  POST /photo/new 
router.post("/new", upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const photo = await new Photo({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id:   req.session.userId,
      comments:  [],
    }).save();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /commentsOfPhoto/:photo_id ────────────────────────────────────────
router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  const { photo_id } = req.params;
  const { comment }  = req.body;

  if (!comment || comment.trim() === "")
    return res.status(400).json({ error: "Comment cannot be empty" });

  if (!mongoose.Types.ObjectId.isValid(photo_id))
    return res.status(400).json({ error: "Invalid photo_id" });

  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) return res.status(400).json({ error: "Photo not found" });

    photo.comments.push({
      comment:   comment.trim(),
      date_time: new Date(),
      user_id:   req.session.userId,
    });
    await photo.save();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
