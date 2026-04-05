import express from "express";
import cors from "cors";
import models from "./models.js"; // Nhập dữ liệu từ file models.js của bạn

const app = express();
const PORT = 8080;

// Bật CORS để cho phép frontend gọi API[cite: 1]
app.use(cors());

// 1. API lấy thông tin schema[cite: 2]
app.get("/test/info", (req, res) => {
  res.json(models.schemaInfo());
});

// 2. API lấy danh sách tất cả người dùng[cite: 2]
app.get("/user/list", (req, res) => {
  res.json(models.userListModel());
});

// 3. API lấy chi tiết một người dùng theo ID[cite: 2]
app.get("/user/:id", (req, res) => {
  const userId = req.params.id; // Lấy tham số ID từ URL[cite: 1]
  const user = models.userModel(userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).send({ message: "Người dùng không tồn tại" });
  }
});

// 4. API lấy danh sách ảnh của một người dùng theo ID[cite: 2]
app.get("/photosOfUser/:id", (req, res) => {
  const userId = req.params.id;
  const photos = models.photoOfUserModel(userId);

  if (photos && photos.length > 0) {
    res.json(photos);
  } else {
    res.status(404).send({ message: "Không tìm thấy ảnh cho người dùng này" });
  }
});

// Khởi động server[cite: 1]
app.listen(PORT, () => {
  console.log(`Backend đang chay tại: http://localhost:${PORT}`);
});
