const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  adminSignUp,
  adminLogin,
  uploadCardImage,
  getCardImages,
  deleteCardImage,
  postCardDetails,
  getCards,
  deleteCardDetails,
  activateCard,
  postArtDetails,
  getArts,
  editArtDetails,
  editArtWithImage,
  deleteArtDetails,
  changeArtStatus,
  editCardDetails,
  getUsers,
  getDashboardData,
  inactivateCard,
} = require("../controllers/adminController");
const authenticate = require("../middleware/authentication");
const adminValidation = require("../validation/adminValidation");
const handleValidationErrors = require("../middleware/validationMiddleware");

const router = express.Router();
// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const artStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/arts");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

// Multer upload middleware
const upload = multer({ storage: storage, fileFilter: fileFilter });
const artUpload = multer({ storage: artStorage, fileFilter: fileFilter });

// !get methods
router.get("/login", adminValidation.login, handleValidationErrors, adminLogin);
router.get("/getCardImages", authenticate, getCardImages);
router.get("/getCards", authenticate, getCards);
router.get("/getArts", authenticate, getArts);
router.get("/getUsers", authenticate, getUsers);
router.get("/getDashboardData", authenticate, getDashboardData);

// !post methods
router.post(
  "/signUp",
  adminValidation.signUp,
  handleValidationErrors,
  adminSignUp
);
router.post(
  "/uploadCardImage",
  authenticate,
  upload.single("image"),
  adminValidation.uploadCardImage,
  handleValidationErrors,
  uploadCardImage
);
router.post(
  "/postCardDetails",
  authenticate,
  adminValidation.createCard,
  handleValidationErrors,
  postCardDetails
);
router.post(
  "/postArtDetails",
  authenticate,
  artUpload.single("image"),
  adminValidation.postArt,
  handleValidationErrors,
  postArtDetails
);

// !put methods
router.put(
  "/activateCard",
  authenticate,
  adminValidation.activateCard,
  handleValidationErrors,
  activateCard
);
router.put(
  "/deleteArtDetails",
  authenticate,
  adminValidation.deleteArt,
  handleValidationErrors,
  deleteArtDetails
);
router.put(
  "/changeArtStatus",
  authenticate,
  adminValidation.changeArtStatus,
  handleValidationErrors,
  changeArtStatus
);
router.put(
  "/editCardDetails",
  authenticate,
  adminValidation.editCardDetails,
  handleValidationErrors,
  editCardDetails
);
router.put(
  "/inactivateCard",
  authenticate,
  adminValidation.inactivateCard,
  handleValidationErrors,
  inactivateCard
);

// !patch methods
router.patch(
  "/editArtDetails",
  authenticate,
  adminValidation.editArt,
  handleValidationErrors,
  editArtDetails
);
router.patch(
  "/editArtWithImage",
  authenticate,
  artUpload.single("image"),
  adminValidation.editArt,
  handleValidationErrors,
  editArtWithImage
);

// !delete Methods
router.delete(
  "/deleteCardImage",
  authenticate,
  adminValidation.deleteCardImage,
  handleValidationErrors,
  deleteCardImage
);
router.delete(
  "/deleteCardDetails",
  authenticate,
  adminValidation.deleteCard,
  handleValidationErrors,
  deleteCardDetails
);
module.exports = router;
