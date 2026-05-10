const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session"); // ← FINAL
const path = require("path");               // ← FINAL


const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AdminRouter = require("./routes/AdminRouter"); // ← FINAL
// const CommentRouter = require("./routes/CommentRouter");

dbConnect();

//  CORS — origin: true, credentials: true 
const corsOptions = {
  origin: true,        // ←   4
  credentials: true,   // ←   4
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));   // ← FINAL

//  Session middleware — 6 
app.use(
  session({
    secret: "your_secret_key",       // ←   6
    resave: false,                   // ←   6
    saveUninitialized: false,        // ←   6
    cookie: {
      httpOnly: true,                // ←   6
      maxAge: 60 * 30 * 1000,        // ←   6 (express-session dùng ms nên × 1000)
    },
  })
);

//  Global auth middleware — kiểm tra session ,8 
app.use((req, res, next) => {
  const isAdminRoute   = req.path.startsWith("/admin");
  const isRegisterUser = req.path === "/api/user" && req.method === "POST";

  if (isAdminRoute || isRegisterUser) return next(); // không cần login

  // 8: if (req.session.userId)
  if (req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.use("/admin",    AdminRouter);
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

app.listen(8081, () => console.log("server listening on port 8081"));