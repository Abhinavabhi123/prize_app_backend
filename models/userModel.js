const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique:true
    },
    password: {
      type: Number,
      require: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    access: {
      type: String,
      default: "active",
    },
    games_participated: [
      {
        game_id: { type: String },
        user_game_id: { type: String },
      },
    ],
    isVerified: false,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User",userSchema);