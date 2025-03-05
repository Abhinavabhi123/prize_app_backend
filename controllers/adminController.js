const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const CardImages = require("../models/cardImgModel");
const Cards = require("../models/cardModel");
const JWT_SECRET = process.env.JWT_SECRET;

const saltValue = 10;
async function adminSignUp(req, res) {
  try {
    const { email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, saltValue);
    await Admin.create({ email, password: hashPassword }).then(() =>
      res.status(200).json({ isSuccess: true, message: "Admin Login Success" })
    );
  } catch (error) {
    res.status(404).json({ isSuccess: false, message: "Admin Login failed" });
    console.error("Admin sign-up error:", error);
  }
}

async function adminLogin(req, res) {
  try {
    const { data } = req.headers;
    const { email, password } = JSON.parse(data);

    const adminData = await Admin.findOne({ email });
    if (!adminData) {
      return res
        .status(404)
        .json({ message: "User not found, Please check the email!" });
    }

    const isMatch = await bcrypt.compare(password, adminData.password);
    if (!isMatch) {
      await res
        .status(401)
        .json({ isSuccess: false, message: "Invalid password!!" });
      return;
    }
    const token = jwt.sign(
      { id: adminData._id, email: adminData.email },
      JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res
      .status(200)
      .json({ isSuccess: true, message: "Login successful", token });
  } catch (error) {
    console.error(error);
  }
}

// Card image uploading function
async function uploadCardImage(req, res) {
  try {
    const { imageName } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const cardData = await CardImages.findOne({ imageName });
    if (!cardData) {
      const response = await CardImages.create({
        imageName,
        image: req.file.filename,
      });
      return res
        .status(200)
        .json({ isSuccess: true, message: "Image stored Successfully" });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "The Image name is already exists!!",
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ isSuccess: false, message: "Internal Server Error" });
  }
}

// function for getting the card images
async function getCardImages(req, res) {
  try {
    const cardImages = await CardImages.find();
    if (cardImages) {
      return res.status(200).json({
        isSuccess: true,
        message: "Card Image fetched successfully",
        data: cardImages,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to fetch card images ,Please try again",
    });
  }
}

async function deleteCardImage(req, res) {
  try {
    const { id } = req.headers;

    const cardImage = await CardImages.findOne({ _id: id });

    if (cardImage) {
      const filename = cardImage.image;
      const filePath = path.join(__dirname, "../uploads", filename);
      // Check if file exists before deleting
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          return res.status(404).json({ message: "File not found" });
        }

        // Remove file
        fs.unlink(filePath, async (err) => {
          if (err) {
            return res.status(500).json({ message: "Error deleting file" });
          }
          await CardImages.deleteOne({ _id: id }).then(() => {
            return res.status(200).json({
              isSuccess: true,
              message: "File deleted successfully!",
            });
          });
        });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function postCardDetails(req, res) {
  try {
    const {
      cardName,
      cardId,
      startDate,
      endDate,
      priceMoney,
      premium,
      cardImageId,
    } = req.body;
    const cardDetails = await Cards.exists({
      $or: [{ name: cardName }, { cardId }].filter(Boolean),
    });
console.log(cardDetails,"oooh");

    if(cardDetails){
      return res.status(404).json({
        isSuccess:false,
        message:"The card is exist in the database!!"
      })
    }
    await Cards.create({
      name: cardName,
      cardId,
      startDate,
      endDate,
      priceMoney,
      premium,
      image: cardImageId,
    }).then(() => {
      return res.status(200).json({
        isSuccess: true,
        message: "Card Created Successful",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  adminSignUp,
  adminLogin,
  uploadCardImage,
  getCardImages,
  deleteCardImage,
  postCardDetails,
};
