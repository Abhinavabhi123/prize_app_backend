const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
    // couponCode: {
    //   type: String,
    // },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    auction: {
      type: Boolean,
      default: false,
    },
    auctionDetails: {
      auction_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      auction_date: { type: String },
      auction_price: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
