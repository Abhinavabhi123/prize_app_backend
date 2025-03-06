const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const CardImages = require("../models/cardImgModel");
const Cards = require("../models/cardModel");
const JWT_SECRET = process.env.JWT_SECRET;
const Arts = require("../models/artModel");

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
    let cardDetails = await Cards.find({ isDelete: false });
    if (cardDetails.length > 0) {
      if (
        cardDetails.filter((card) => card.endDate > new Date(startDate))
          .length > 0
      ) {
        return res.status(404).json({
          isSuccess: false,
          message:
            "The start date must be greater than the end date of the most recent card.!",
        });
      }
      if (
        cardDetails.filter(
          (card) => card.name === cardName || card.cardId === cardId
        ).length > 0
      ) {
        return res.status(404).json({
          isSuccess: false,
          message: "The card is already stored with name or card Id !!",
        });
      }
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

// function to fetch cards

async function getCards(req, res) {
  try {
    const response = await Cards.find({ isDelete: false }).populate("image");
    if (response) {
      return res.status(200).json({
        isSuccess: true,
        message: "Cards fetched Successfully",
        data: response,
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

async function deleteCardDetails(req, res) {
  try {
    const { cardid } = req.headers;
    const response = await Cards.updateOne(
      { _id: cardid },
      { $set: { isDelete: true, status: false } }
    );
    if (response && response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Card deleted successfully",
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "Card not found",
      });
    }
  } catch (error) {
    console.error(`Error deleting card with ID ${cardid}:`, error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function activateCard(req, res) {
  try {
    const { cardid } = req.headers;
    const activeCards = await Cards.find({
      $and: [{ status: true }, { completed: false }],
    });
    if (activeCards.length > 0) {
      return res.status(404).json({
        isSuccess: false,
        message: "One card is already activated",
      });
    }
    const response = await Cards.updateOne(
      { _id: cardid },
      { $set: { status: true } }
    );
    if (response && response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Card status changed successfully",
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "Issue while changing card status",
      });
    }
  } catch (error) {
    console.error(`Error change status of card with ID ${cardid}:`, error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// function for create new art
async function postArtDetails(req, res) {
  try {
    const { name, price, description, question, answer } = req.body;
    if (!req.file) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "Image file is missing" });
    }
    const response = await Arts.create({
      name,
      price,
      description,
      question,
      answer,
      image: req.file.filename,
      ownerId: req.user.id,
      ownerModel: "Admin",
    });
    if (response) {
      return res
        .status(200)
        .json({ isSuccess: true, message: "Art stored successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function getArts(req, res) {
  try {
    const response = await Arts.find({ isDelete: false }).populate({
      path: "ownerId",
      select: "-password -email",
    });
    if (response) {
      return res.status(200).json({
        isSuccess: true,
        message: "Art data fetched successfully",
        data: response,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// edit art details with out image
async function editArtDetails(req, res) {
  try {
    const { artid } = req.headers;

    if (!artid) {
      return (
        res.status(404),
        json({
          isSuccess: false,
          message: "Art id is missing!!",
        })
      );
    }
    const { name, description, price, question, answer } = req.body;
    const response = await Arts.updateOne(
      { _id: artid },
      {
        $set: {
          name,
          description,
          price,
          question,
          answer,
        },
      }
    );
    if (response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Art edited successfully",
      });
    } else {
      return (
        res.status(404),
        json({
          isSuccess: false,
          message: "Failed to edit art!",
        })
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// function to edit art data with image
async function editArtWithImage(req, res) {
  try {
    const { artid } = req.headers;

    if (!artid) {
      return (
        res.status(404),
        json({
          isSuccess: false,
          message: "Art id is missing!!",
        })
      );
    }
    if (!req.file) {
      return res.status(404).send({
        isSuccess: false,
        message: "Art Edit issue while uploading image!",
      });
    }
    const { name, description, price, question, answer } = req.body;
    const response = await Arts.updateOne(
      { _id: artid },
      {
        $set: {
          name,
          description,
          price,
          question,
          answer,
          image: req.file.filename,
        },
      }
    );
    if (response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Art edited successfully",
      });
    } else {
      return (
        res.status(404),
        json({
          isSuccess: false,
          message: "Failed to edit art!",
        })
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// function to delete art data
async function deleteArtDetails(req, res) {
  try {
    const { artid } = req.headers;
    if (!artid) {
      return res.status(404).json({
        isSuccess: false,
        message: "The art id is missing",
      });
    }
    const response = await Arts.updateOne(
      { _id: artid },
      {
        $set: {
          isDelete: true,
        },
      }
    );
    if (response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Art deleted successfully",
      });
    } else {
      return (
        res.status(404),
        json({
          isSuccess: false,
          message: "Failed to delete art!",
        })
      );
    }
  } catch (error) {
    console.log(error);
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
  getCards,
  deleteCardDetails,
  activateCard,
  postArtDetails,
  getArts,
  editArtDetails,
  editArtWithImage,
  deleteArtDetails,
};
