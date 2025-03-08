const express = require("express");
const {
  GoogleAuth,
  UserLogin,
  getUserDetails,
  getGamesAndArts,
  googlepay,
  checkAnswer,
  userLoginWithMobile,
  registerUserWithMobile,
  purchaseArt,
} = require("../controllers/userController");

const router = express.Router();
const authenticate = require("../middleware/authentication");
const userValidate = require("../validation/userValidation");
const handleValidationErrors = require("../middleware/validationMiddleware");
//!get methods
router.get("/userLogin", UserLogin);
router.get(
  "/userLoginWithMobile",
  userValidate.userLoginMobile,
  handleValidationErrors,
  userLoginWithMobile
);
router.get("/getGamesAndArts", getGamesAndArts);
router.get(
  "/getUserDetails",
  authenticate,
  userValidate.getUserDetails,
  handleValidationErrors,
  getUserDetails
);
router.get(
  "/checkAnswer",
  userValidate.checkAnswer,
  handleValidationErrors,
  checkAnswer
);
router.get(
  "/purchaseArt",
  authenticate,
  userValidate.purchaseArt,
  handleValidationErrors,
  purchaseArt
);

// !post methods
router.post("/googleAuth", GoogleAuth);
router.post("/googlepay", googlepay);
router.post(
  "/registerUserWithMobile",
  userValidate.userRegisterWithMobile,
  handleValidationErrors,
  registerUserWithMobile
);

module.exports = router;
