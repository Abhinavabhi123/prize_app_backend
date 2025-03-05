const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    imageName: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CardImage", imageSchema);
