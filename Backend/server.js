const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const http = require("http");
const socketio = require("socket.io");

const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/food");
const notificationRoutes = require("./routes/notification"); // 🔔

const app = express();

// ================= SERVER + SOCKET =================
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io globally accessible
global.io = io;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= SOCKET HANDLING =================
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("registerUser", (userId) => {
    socket.join(userId); // room = userId
    console.log("📌 User joined room:", userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);

/**
 * 🔔 IMPORTANT
 * MUST be singular to match frontend:
 * /api/notification
 */
app.use("/api/notification", notificationRoutes);

// ================= DB + START =================
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully 👍");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) =>
    console.error("MongoDB connection failed ❌", err)
  );
