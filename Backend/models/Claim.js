const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodPost" },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String
}, { timestamps: true });

module.exports = mongoose.model("Claim", ClaimSchema);
