const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const CardImages = require("../models/cardImgModel");
const Cards = require("../models/cardModel");
const JWT_SECRET = process.env.JWT_SECRET;
const Arts = require("../models/artModel");
const Users = require("../models/userModel");
const Coupons = require("../models/couponModel");
const scheduleEliminations = require("../utils/eliminationScheduler");
const schedulePickWinner = require("../utils/pickWinnerScheduler");
const scheduleLuckyDrawStart = require("../utils/startLuckyDrawScheduler");

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
    const { email, password } = req.headers;

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
    res
      .status(500)
      .json({ isSuccess: false, message: "Internal Server Error" });
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
      startDate,
      endDate,
      priceMoney,
      premium,
      cardImageId,
      eliminationStages,
    } = req.body;

    let cardDetails = await Cards.find({ isDelete: false });
    if (cardDetails.length > 0) {
      if (cardDetails.filter((card) => card.name === cardName).length > 0) {
        return res.status(404).json({
          isSuccess: false,
          message: "The card is already stored with name!!",
        });
      }
    }
    // code to sort elimination stages with date if the date is shuffled
    const sortedData = eliminationStages.sort(
      (a, b) => new Date(a.stageDate) - new Date(b.stageDate)
    );

    await Cards.create({
      name: cardName,
      startDate,
      endDate,
      priceMoney,
      premium,
      image: cardImageId,
      eliminationStages: sortedData,
      isEliminationStarted: false,
      id: cardDetails.length + 1,
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
    const response = await Cards.find({ isDelete: false })
      .populate("image")
      .populate({ path: "winnerCoupon", populate: { path: "userId" } })
      .populate("name")
      .sort({ createdAt: -1 });

    const modifiedResponse = await Promise.all(
      response.map(async (card) => {
        const couponCount = await Coupons.countDocuments({
          couponCard: card._id,
        });

        return {
          ...card.toObject(),
          couponCount,
        };
      })
    );
    if (response) {
      return res.status(200).json({
        isSuccess: true,
        message: "Cards fetched Successfully",
        data: modifiedResponse,
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
      scheduleLuckyDrawStart();
      scheduleEliminations();
      schedulePickWinner();
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
    const cardData = await Cards.findOne({
      _id: cardid,
    });
    if (!cardData) {
      return res.status(404).json({
        isSuccess: false,
        message: "Issue while fetching the card details!!",
      });
    }
    const currentDate = new Date();
    const startDate = new Date(cardData.startDate);

    if (currentDate > startDate) {
      return res.status(404).json({
        isSuccess: false,
        message: "Card Activation Failed,The start date has already passed.",
      });
    }
    const cards = await Cards.countDocuments({
      status: true,
      isDelete: false,
      isEliminationStarted: false,
    });
    const artCount = await Arts.countDocuments({
      status: true,
      isDelete: false,
    });
    if (cards + 1 > artCount) {
      return res.status(404).json({
        isSuccess: false,
        message:
          "Not enough arts found. Please create more arts to activate the card!",
      });
    } else {
      const response = await Cards.updateOne(
        { _id: cardid },
        { $set: { status: true } }
      );
      scheduleLuckyDrawStart();
      scheduleEliminations();
      schedulePickWinner();
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
    const artData = await Arts.findOne({ name });
    if (artData) {
      return res.status(404).json({
        isSuccess: false,
        message: "The art is already exist with the name!",
      });
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
    const artData = await Arts.findOne({ name, _id: { $ne: artid } });
    if (artData) {
      return res.status(404).json({
        isSuccess: false,
        message: "The art is already exist with the name!",
      });
    }
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
    const artData = await Arts.findOne({ name, _id: { $ne: artid } });
    if (artData) {
      return res.status(404).json({
        isSuccess: false,
        message: "The art is already exist with the name!",
      });
    }
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
async function changeArtStatus(req, res) {
  try {
    const { id } = req.body;
    const art = await Arts.findById(id);
    if (!art) {
      return res.status(404).json({ message: "Art not found" });
    }
    const response = await Arts.updateOne(
      { _id: id },
      { $set: { status: !art.status } }
    );
    if (response.modifiedCount === 1) {
      return res.status(200).json({
        isSuccess: true,
        message: "Art status changed successfully",
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "Issue while changing the status of the art!!",
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

// function to update the card details
async function editCardDetails(req, res) {
  try {
    const { cardid } = req.headers;
    const {
      cardName,
      priceMoney,
      premium,
      endDate,
      startDate,
      cardImageId,
      eliminationStages,
    } = req.body;
    const cardData = await Cards.findOne({ _id: cardid });
    if (!cardData) {
      return res.status(200).json({
        isSuccess: false,
        message: "Issue while fetching card details!!",
      });
    }
    if (cardData.completed === true) {
      return res.status(404).json({
        isSuccess: false,
        message: "The card is already picked a winner.",
      });
    }
    // code to sort elimination stages with date if the date is shuffled
    const sortedData = eliminationStages.sort(
      (a, b) => new Date(a.stageDate) - new Date(b.stageDate)
    );

    const response = await Cards.updateOne(
      { _id: cardid },
      {
        $set: {
          name: cardName,
          startDate,
          endDate,
          priceMoney,
          premium,
          image: cardImageId,
          eliminationStages: sortedData,
        },
      }
    );

    if (response.modifiedCount === 1) {
      scheduleLuckyDrawStart();
      scheduleEliminations();
      schedulePickWinner();
      return res.status(200).json({
        isSuccess: true,
        message: "Card details updated successfully ",
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "Issue while updating card details !!",
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

async function getUsers(req, res) {
  try {
    const userData = await Users.find();
    return res.status(200).send({
      isSuccess: true,
      message: "User data fetched successfully",
      userData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function getDashboardData(req, res) {
  try {
    const userData = await Users.find(
      {},
      { name: 1, picture: 1, coupons: 1, total_amount: 1 }
    )
      .sort({ coupons: -1 })
      .limit(7);

    const userArtData = await Users.aggregate([
      {
        $project: {
          name: 1,
          picture: 1,
          purchasedArts: 1,
          totalArtsOwned: { $sum: "$purchasedArts.count" },
        },
      },
      { $sort: { totalArtsOwned: -1 } },
      { $limit: 7 },
    ]);

    const users = await Users.countDocuments();
    const completedCards = await Cards.countDocuments({ completed: true });
    const arts = await Arts.countDocuments({ isDelete: false });
    const coupons = await Coupons.countDocuments();
    const cards = await Cards.countDocuments({ isDelete: false });
    const walletSummary = await Users.aggregate([
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$total_amount" },
          totalWithdrawn: { $sum: "$withDrawAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalInvested: 1,
          totalWithdrawn: 1,
        },
      },
    ]);

    return res.status(200).json({
      isSuccess: true,
      message: "Dashboard data fetched successfully",
      userData,
      userArtData,
      users,
      dashData: {
        users,
        arts,
        completedCards,
        coupons,
        cards,
      },
      walletSummary: {
        totalInvested: walletSummary[0]?.totalInvested || 0,
        totalWithdrawn: walletSummary[0]?.totalWithdrawn || 0,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}
// function to inactive the card status
async function inactivateCard(req, res) {
  try {
    const { cardid } = req.headers;
    const cardData = await Cards.findOne({
      _id: cardid,
    });
    if (!cardData) {
      return res.status(404).json({
        isSuccess: false,
        message: "Issue while fetching the card details!!",
      });
    }
    const response = await Cards.updateOne(
      { _id: cardid },
      { $set: { status: false } }
    );
    scheduleLuckyDrawStart();
    scheduleEliminations();
    schedulePickWinner();
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
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// function to get the art data for card creation
async function getArtForCardCreation(req, res) {
  try {
    const artData = await Arts.find({ status: true, isDelete: false });
    return res.status(200).json({
      isSuccess: true,
      message: "Art data fetched successfully",
      artData,
    });
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
  changeArtStatus,
  editCardDetails,
  getUsers,
  getDashboardData,
  inactivateCard,
  getArtForCardCreation,
};
