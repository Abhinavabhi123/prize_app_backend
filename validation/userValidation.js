const { header, body } = require("express-validator");

const userValidation = {
  getUserDetails: [header("id").notEmpty().withMessage("User Id is required")],
  checkAnswer: [
    header("id").notEmpty().withMessage("Art Id is required"),
    header("answer").notEmpty().withMessage("Answer is required"),
  ],
  userLoginMobile: [
    header("mobile")
      .notEmpty()
      .withMessage("Mobile number is required")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile number must be exactly 10 digits")
      .isNumeric()
      .withMessage("Mobile number must contain only numbers"),
    header("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userLoginEmail: [
    header("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
      .withMessage("Email must have a valid domain with a TLD"),

    header("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userRegisterWithMobile: [
    body("mobile")
      .notEmpty()
      .withMessage("Mobile number is required")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile number must be exactly 10 digits")
      .isNumeric()
      .withMessage("Mobile number must contain only numbers"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  purchaseArt: [
    header("id").notEmpty().withMessage("Art Id is required"),
    header("quantity")
      .notEmpty()
      .withMessage("Art purchase Quantity is required"),
  ],
  uploadProfileImage: [
    body("image").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Image is required");
      }
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new Error("Only JPG, PNG, and JPEG files are allowed");
      }
      if (req.file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }
      return true;
    }),
  ],
  getOtp: [
    header("mobile")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile number must be exactly 10 digits")
      .isNumeric()
      .withMessage("Mobile number must contain only numbers")
      .notEmpty()
      .withMessage("Mobile number is required"),
  ],
  updateMobileNumber:[
    body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isString()
    .withMessage('OTP must be a string')
    .matches(/^[0-9]{4}$/) // Assuming 4-digit OTP, adjust as needed
    .withMessage('OTP must be a 4-digit number'),

  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone('any') // Or specify a locale like 'en-IN' for Indian numbers
    .withMessage('Invalid mobile number'),
  ],
  getEmailOtp:[
    header("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    .withMessage("Email must have a valid domain with a TLD"),
  ]
};
module.exports = userValidation;
