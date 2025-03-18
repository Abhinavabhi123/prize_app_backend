const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Admin = require("../models/adminModel");

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .send({ isSuccess: false, message: "Access Denied! No token provided." });
  }

  try {
    const verified = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    const user = await User.findOne({ _id: verified.id });
    const admin = await Admin.findOne({ _id: verified.id });
    if (!user && !admin) {
      return res.status(401).json({
        isSuccess: false,
        message: "User not found. Please login again.",
      });
    }
    req.user = verified;
    next();
  } catch (error) {
    res
      .status(403)
      .send({ isSuccess: false, message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
