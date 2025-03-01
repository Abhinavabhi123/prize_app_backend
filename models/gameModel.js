const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  gameId: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  entryPrice: {
    type: Number,
    required: true,
  },
  priceMoney: {
    type: Number,
    default: 0,
  },
  priceGift: {
    priceName: {
      type: String,
    },
    priceDescription: {
      type: String,
    },
    priceImage: [String],
  },
  premiumAmount: {
    type: Number,
    required: true,
  },
},{
    timestamps:true
}
);


module.exports = mongoose.model("Game",gameSchema);