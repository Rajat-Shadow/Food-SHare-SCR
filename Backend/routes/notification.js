const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Auth middleware (same logic)
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.json({ error: "Invalid token" });
  }
}

// ================= GET ALL NOTIFICATIONS =================
router.get("/", auth, async (req, res) => {
  const notifs = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json(notifs);
});

// ================= GET UNREAD COUNT =================
router.get("/unread-count", auth, async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user.id,
    read: false
  });

  res.json({ count });
});

// ================= MARK ALL AS READ =================
router.post("/mark-read", auth, async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { $set: { read: true } }
  );

  res.json({ success: true });
});

module.exports = router;
