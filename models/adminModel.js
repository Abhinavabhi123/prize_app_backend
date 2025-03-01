const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    lowercase: true,
    unique:true
  },
  password: {
    type: String,
    required: true,
  },
},{
    timestamps:true
});
module.exports = mongoose.model("Admin", adminSchema);
