const express = require("express");
const path = require("path");
const multer = require("multer");
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
  changeUserProfileImage,
  updateMobileNumber,
  getOtp,
  getEmailOtp,
  registerUserWithEmail,
  checkEmailAndGetOtp,
  verifyEmailOtp,
  changePasswordWithEmail,
  checkMobileAndGetOtp,
  verifyMobileOtp,
  changePasswordWithMobile,
} = require("../controllers/userController");

const router = express.Router();
const authenticate = require("../middleware/authentication");
const userValidate = require("../validation/userValidation");
const handleValidationErrors = require("../middleware/validationMiddleware");

const userImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/userImage");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

// Multer upload middleware
const userImageUpload = multer({
  storage: userImageStorage,
  fileFilter: fileFilter,
});

//!get methods
router.get(
  "/userLogin",
  userValidate.userLoginEmail,
  handleValidationErrors,
  UserLogin
);
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
router.get("/getOtp", userValidate.getOtp, handleValidationErrors, getOtp);
router.get(
  "/getEmailOtp",
  userValidate.getEmailOtp,
  handleValidationErrors,
  getEmailOtp
);
router.get(
  "/checkEmailAndGetOtp",
  userValidate.checkEmailAndGetOtp,
  handleValidationErrors,
  checkEmailAndGetOtp
);
router.get(
  "/verifyEmailOtp",
  userValidate.verifyEmailOtp,
  handleValidationErrors,
  verifyEmailOtp
);
router.get(
  "/checkMobileAndGetOtp",
  userValidate.checkMobileAndGetOtp,
  handleValidationErrors,
  checkMobileAndGetOtp
);
router.get(
  "/verifyMobileOtp",
  userValidate.verifyMobileOtp,
  handleValidationErrors,
  verifyMobileOtp
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
router.post(
  "/changeUserProfileImage",
  authenticate,
  userImageUpload.single("image"),
  userValidate.uploadProfileImage,
  handleValidationErrors,
  changeUserProfileImage
);
router.post(
  "/registerUserWithEmail",
  userValidate.userRegisterWithEmail,
  handleValidationErrors,
  registerUserWithEmail
);
router.post(
  "/changePasswordWithEmail",
  userValidate.changePasswordWithEmail,
  handleValidationErrors,
  changePasswordWithEmail
);
router.post(
  "/changePasswordWithMobile",
  userValidate.changePasswordWithMobile,
  handleValidationErrors,
  changePasswordWithMobile
);
// !put methods
router.put(
  "/updateMobileNumber",
  userValidate.updateMobileNumber,
  handleValidationErrors,
  updateMobileNumber
);

module.exports = router;
