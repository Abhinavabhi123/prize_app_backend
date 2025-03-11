const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
    },
    mobile: {
      type: Number,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    picture: {
      type: String,
    },
    access: {
      type: Boolean,
      default: true,
    },
    coupons: [
      {
        couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      },
    ],
    purchasedArts: [
      {
        artId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Art",
        },
        count: {
          type: Number,
        },
        purchaseDate: { type: Date, default: Date.now },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    withDrawAmount: {
      type: Number,
      default: 0,
    },
    pendingWalletAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
