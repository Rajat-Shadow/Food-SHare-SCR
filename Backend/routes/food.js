const express = require("express");
const router = express.Router();
const FoodPost = require("../models/FoodPost");
const Claim = require("../models/Claim");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.json({ error: "Invalid token" });
  }
}

// ================= CREATE FOOD POST =================
router.post("/create", auth, async (req, res) => {
  try {
    const post = await FoodPost.create({
      ...req.body,
      postedBy: req.user.id
    });

    // 🔔 Notify ALL NGOs
    const ngos = await User.find({ role: "ngo" });

    for (const ngo of ngos) {
      const notif = await Notification.create({
        userId: ngo._id,
        message: `New food available: ${post.title} (${post.location})`,
        type: "new_food"
      });

      // ✅ MUST MATCH FRONTEND
      global.io.to(ngo._id.toString()).emit("newNotification", notif);
    }

    res.json(post);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ================= LIST FOOD POSTS =================
router.get("/list", async (req, res) => {
  const posts = await FoodPost.find().sort({ createdAt: -1 });
  res.json(posts);
});

// ================= CLAIM FOOD =================
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) return res.json({ error: "Food not found" });

    const claim = await Claim.create({
      foodId: post._id,
      ngoId: req.user.id,
      message: req.body.message
    });

    post.status = "claimed";
    await post.save();

    // 🔔 Notify DONOR (PG)
    const notif = await Notification.create({
      userId: post.postedBy,
      message: `An NGO has claimed your food: ${post.title}. Please pack it up.`,
      type: "food_claimed"
    });

    // ✅ MUST MATCH FRONTEND
    global.io.to(post.postedBy.toString()).emit("newNotification", notif);

    res.json({ success: true, claim });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ================= HISTORY: NGO =================
router.get("/history/ngo", auth, async (req, res) => {
  if (req.user.role !== "ngo")
    return res.json({ error: "Not authorized" });

  const history = await Claim.find({ ngoId: req.user.id })
    .populate("foodId")
    .populate("ngoId")
    .sort({ createdAt: -1 });

  res.json(history);
});

// ================= HISTORY: DONOR =================
router.get("/history/donor", auth, async (req, res) => {
  if (req.user.role !== "pg")
    return res.json({ error: "Not authorized" });

  const posts = await FoodPost.find({ postedBy: req.user.id });
  const postIds = posts.map(p => p._id);

  const history = await Claim.find({ foodId: { $in: postIds } })
    .populate("foodId")
    .populate("ngoId")
    .sort({ createdAt: -1 });

  res.json(history);
});

module.exports = router;
