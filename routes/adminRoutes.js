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
  deleteCardDetails
} = require("../controllers/adminController");
const authenticate = require("../middleware/authentication");

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

router.get("/login", adminLogin);
router.get("/getCardImages", authenticate, getCardImages);
router.get("/getCards",authenticate,getCards)

router.post("/signUp", adminSignUp);
router.post(
  "/uploadCardImage",
  authenticate,
  upload.single("image"),
  uploadCardImage
);
router.post("/postCardDetails",authenticate,postCardDetails)


router.delete("/deleteCardImage",authenticate,deleteCardImage)
router.delete("/deleteCardDetails",authenticate,deleteCardDetails)
module.exports = router;
