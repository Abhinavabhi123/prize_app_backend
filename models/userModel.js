const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: Number,
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
    games_participated: [
      {
        game_id: { type: String },
        user_game_id: { type: String },
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
