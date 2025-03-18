const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    cardId: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    priceMoney: {
      type: Number,
      default: 0,
    },
    premium: {
      type: Number,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CardImage",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    eliminationStages: [
      {
        stageDate: { type: String },
        status: { type: Boolean },
      },
    ],
    isEliminationStarted: {
      type: Boolean,
      default: false,
    },
    winnerCoupon:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Card", cardSchema);
