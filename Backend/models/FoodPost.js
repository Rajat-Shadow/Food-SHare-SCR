const mongoose = require("mongoose");

const FoodPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  quantity: String,
  location: String,
  status: { type: String, default: "available" },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("FoodPost", FoodPostSchema);
