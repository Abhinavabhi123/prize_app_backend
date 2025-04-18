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
  getUserCoupons,
  makeCouponForAuction,
  getUserAuctionCoupons,
  startAuction,
  getAllAuctions,
  changeUserName,
  updateUserDetails,
  auctionParticipation,
  couponForAuction,
  getWinners
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
router.get(
  "/getUserCoupons",
  authenticate,
  userValidate.getUserCoupons,
  handleValidationErrors,
  getUserCoupons
);
router.get(
  "/makeCouponForAuction",
  authenticate,
  userValidate.makeCouponForAuction,
  handleValidationErrors,
  makeCouponForAuction
);
router.get(
  "/getUserAuctionCoupons",
  authenticate,
  userValidate.auctionData,
  handleValidationErrors,
  getUserAuctionCoupons
);
router.get(
  "/getAllAuctions",
  authenticate,
  userValidate.getAllAuctions,
  handleValidationErrors,
  getAllAuctions
);
router.get(
  "/changeUserName",
  authenticate,
  userValidate.changeUserName,
  handleValidationErrors,
  changeUserName
);
router.get(
  "/auctionParticipation",
  authenticate,
  userValidate.auctionParticipation,
  handleValidationErrors,
  auctionParticipation
);
router.get("/couponForAuction", authenticate, couponForAuction);
router.get("/getWinners",getWinners)

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
router.post(
  "/updateUserDetails",
  authenticate,
  userValidate.updateUserDetails,
  handleValidationErrors,
  updateUserDetails
);

// !put methods
router.put(
  "/updateMobileNumber",
  userValidate.updateMobileNumber,
  handleValidationErrors,
  updateMobileNumber
);

router.put(
  "/startAuction",
  authenticate,
  userValidate.startAuction,
  handleValidationErrors,
  startAuction
);

module.exports = router;
