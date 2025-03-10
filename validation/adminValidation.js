const { body, header } = require("express-validator");

const adminValidation = {
  signUp: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],

  login: [
    header("email").isEmail().withMessage("Invalid email format"),
    header("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],

  createCard: [
    body("cardName")
      .trim()
      .notEmpty()
      .withMessage("Card name is required")
      .isLength({ min: 3 })
      .withMessage("Card name must be at least 3 characters")
      .isLength({ max: 50 })
      .withMessage("Card name cannot exceed 50 characters"),

    body("cardId")
      .trim()
      .notEmpty()
      .withMessage("Card ID is required")
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage("Card ID must be alphanumeric"),

    body("priceMoney")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),

    body("premium")
      .notEmpty()
      .withMessage("Premium amount is required")
      .isFloat({ gt: 0 })
      .withMessage("Premium must be greater than 0"),

    body("startDate").notEmpty().withMessage("Start date is required"),
    body("endDate").notEmpty().withMessage("End date is required"),
    body("cardImageId").notEmpty().withMessage("Image is required"),
  ],
  deleteCard: [header("cardid").notEmpty().withMessage("Card Id is missing")],
  uploadCardImage: [
    body("imageName").trim().notEmpty().withMessage("Image name is required"),

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
  deleteCardImage: [
    header("id").notEmpty().withMessage("Card Image id is missing"),
  ],
  postArt: [
    body("name").trim().notEmpty().withMessage("Name is required"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),

    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than zero")
      .toFloat(),

    body("question").trim().notEmpty().withMessage("Question is required"),

    body("answer").trim().notEmpty().withMessage("Answer is required"),

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
  editArt: [
    body("name").trim().notEmpty().withMessage("Name is required"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),

    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than zero")
      .toFloat(),

    body("question").trim().notEmpty().withMessage("Question is required"),

    body("answer").trim().notEmpty().withMessage("Answer is required"),

    body("image")
      .optional()
      .custom((value, { req }) => {
        if (!req.file) {
          return true; // Image is optional, so if no file is uploaded, pass validation
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
  deleteArt: [header("artid").notEmpty().withMessage("Art id is missing")],
  changeArtStatus:[
    body("id")
    .notEmpty()
    .withMessage("Id is required")
  ],
  editCardDetails:[
    body("cardName")
    .trim()
    .notEmpty()
    .withMessage("Card name is required")
    .isLength({ min: 3 })
    .withMessage("Card name must be at least 3 characters")
    .isLength({ max: 50 })
    .withMessage("Card name cannot exceed 50 characters"),

  body("cardId")
    .trim()
    .notEmpty()
    .withMessage("Card ID is required")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("Card ID must be alphanumeric"),

  body("priceMoney")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),

  body("premium")
    .notEmpty()
    .withMessage("Premium amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Premium must be greater than 0"),

  body("startDate").notEmpty().withMessage("Start date is required"),
  body("endDate").notEmpty().withMessage("End date is required"),
  body("cardImageId").notEmpty().withMessage("Image is required"),
  header("cardId").notEmpty().withMessage("Card id is required"),
  ]
};

module.exports = adminValidation;
