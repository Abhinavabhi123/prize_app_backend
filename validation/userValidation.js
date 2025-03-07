const { header } = require("express-validator");

const userValidation = {
  getUserDetails: [header("id").notEmpty().withMessage("User Id is required")],
  checkAnswer: [
    header("id").notEmpty().withMessage("Art Id is required"),
    header("answer").notEmpty().withMessage("Answer is required"),
  ],
};
module.exports = userValidation;
