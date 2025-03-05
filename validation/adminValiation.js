const { body } = require("express-validator");

const validateAdminLogin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail()
    .notEmpty()
    .withMessage("Username is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .notEmpty()
    .withMessage("Username is required"),
];

module.exports = {
  validateAdminLogin,
};
