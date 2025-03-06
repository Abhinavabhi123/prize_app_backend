const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
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

    req.user = verified;
    next();
  } catch (error) {
    res
      .status(403)
      .send({ isSuccess: false, message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
