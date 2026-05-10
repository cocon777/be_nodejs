/**
 * dbLoad.js - Nạp dữ liệu mẫu từ modelData/models.js vào MongoDB Atlas.
 *
 * Chạy: node db/dbLoad.js
 *
 * ⚠️  Script này XÓA SẠCH toàn bộ dữ liệu cũ trước khi nạp mới.
 */
const mongoose = require("mongoose");
const path = require("path");

const bcrypt = require("bcryptjs"); // ← FINAL

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const models = require("../modelData/models");
const User = require("./userModel");
const Photo = require("./photoModel");
const SchemaInfo = require("./schemaInfo");

async function dbLoad() {
  // ── Kết nối ────────────────────────────────────────────────────────────────
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅  Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌  Connection failed:", err.message);
    process.exit(1);
  }

  // ── Xóa dữ liệu cũ ─────────────────────────────────────────────────────────
  await User.deleteMany({});
  await Photo.deleteMany({});
  await SchemaInfo.deleteMany({});
  console.log("🗑️   Cleared existing collections");

  // ── Nạp Users ───────────────────────────────────────────────────────────────
  // mapFakeId2RealId: ánh xạ fake _id (string) → MongoDB ObjectId thực
  const mapFakeId2RealId = {};
  const userModels = models.userListModel();

  for (const u of userModels) {
    const hashedPassword = await bcrypt.hash("123456", 10); // ← FINAL
    const saved = await new User({
      first_name: u.first_name,
      last_name: u.last_name,
      location: u.location,
      description: u.description,
      occupation: u.occupation,
      login_name: u.first_name.toLowerCase(), // ← FINAL vd: "quyet", "minh"
      password: hashedPassword, // ← FINAL  password hash,mặc định 1 đến 6
    }).save();

    mapFakeId2RealId[u._id] = saved._id;
    u.objectID = saved._id; // gắn real ID vào object fake để dùng cho comment
    console.log(`👤  User: ${u.first_name} ${u.last_name}  →  ${saved._id}`);
  }

  // ── Nạp Photos + Comments ───────────────────────────────────────────────────
  // Gom tất cả ảnh từ mọi user
  const allPhotos = [];
  for (const fakeId of Object.keys(mapFakeId2RealId)) {
    allPhotos.push(...models.photoOfUserModel(fakeId));
  }

  for (const p of allPhotos) {
    const realUserId = mapFakeId2RealId[p.user_id];

    // Xây comments array với real user_id
    const comments = (p.comments || []).map((c) => ({
      comment: c.comment,
      date_time: c.date_time,
      user_id: c.user.objectID, // objectID đã được gắn ở bước User
    }));

    const saved = await new Photo({
      file_name: p.file_name,
      date_time: p.date_time,
      user_id: realUserId,
      comments,
    }).save();

    console.log(
      `📸  Photo: ${p.file_name}  (user: ${realUserId})  →  ${saved._id}` +
        (comments.length ? `  [${comments.length} comment(s)]` : ""),
    );
  }

  // ── SchemaInfo ──────────────────────────────────────────────────────────────
  const schema = await new SchemaInfo({ version: "1.0" }).save();
  console.log(`📋  SchemaInfo created  version=${schema.version}`);

  await mongoose.disconnect();
  console.log("\n🎉  Database loaded successfully!");
}

dbLoad().catch((err) => {
  console.error("Fatal error during dbLoad:", err);
  process.exit(1);
});
