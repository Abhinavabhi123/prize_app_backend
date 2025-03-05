const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
    codes: [
      {
        couponCode: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
