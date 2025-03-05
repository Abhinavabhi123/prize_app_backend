const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cardId: {
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
  priceMoney: {
    type: Number,
    default: 0,
  },
  premium: {
    type: Number,
    required: true,
  },
  image:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"CardImage"
  },
  completed:{
    type:Boolean,
    default:false
  },
  status:{
    type:Boolean,
    default:false
  },
  isDelete:{
    type:Boolean,
    default:false
  }
},{
    timestamps:true
}
);


module.exports = mongoose.model("Card",cardSchema);