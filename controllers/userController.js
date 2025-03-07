const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Stripe = require("stripe");
const Cards = require("../models/cardModel");
const Arts = require("../models/artModel");

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function GoogleAuth(req, res) {
  try {
    const { email, name, picture } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      await User.create({ email, name, picture }).then((response) => {
        const token = jwt.sign(
          { id: response._id, email: response.email },
          JWT_SECRET,
          {
            expiresIn: "30d",
          }
        );
        res.status(200).send({
          isSuccess: true,
          message: "Login successful",
          name: response?.name,
          email: response?.email,
          picture: response?.picture,
          token,
        });
      });
    } else {
      const token = jwt.sign(
        { id: userData._id, email: userData.email, name: userData.name },
        JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      res.status(200).send({
        isSuccess: true,
        message: "Login successful",
        email: userData.email,
        picture: userData.picture,
        name: userData.name,
        token,
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

async function UserLogin(req, res) {
  try {
    const { email, password } = req.headers;
    await User.findOne({ email }).then(async (response) => {
      if (!response) {
        res.status(404).send({
          isSuccess: false,
          message: "Email is incorrect !!",
        });
        return;
      }

      if (!response?.password) {
        res.status(404).send({
          isSuccess: false,
          message:
            "You are not registered with email and password,Please try Google Authentication",
        });
        return;
      }
      const isMatch = await bcrypt.compare(password, adminData.password);
      if (!isMatch) {
        res.status(401).send({
          isSuccess: false,
          message: "Password is incorrect !!",
        });
        return;
      }
      const token = jwt.sign(
        {
          id: response._id,
          email: response.email,
          name: response?.name,
          picture: response?.picture,
        },
        JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      res.status(200).send({
        isSuccess: true,
        message: "Login successful",
        token,
        name: response?.name,
        email: response?.email,
        picture: response?.picture,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function getUserDetails(req, res) {
  try {
    const { id } = req.headers;
    const response = await User.findOne({ _id: id });
    if (response) {
      return res.status(200).json({
        isSuccess: true,
        message: "User details fetched successfully",
        data: response,
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "User data fetching failed",
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

// Google pay payment integration
async function googlepay(req, res) {
  try {
    const { token, amount } = req.body;

    // Create a charge with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "inr",
      payment_method_data: {
        type: "card",
        token,
      },
      confirm: true,
    });

    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

//  function to get the games and arts data for games page
async function getGamesAndArts(req, res) {
  try {
    const cardData = await Cards.findOne({
      completed: false,
      status: true,
      isDelete: false,
    });
    const artData = await Arts.find({ status: true, isDelete: false }).sort({
      purchaseCount: 1,
    });
    return res.status(200).send({
      isSuccess: true,
      message: "Card and art data fetched successfully",
      cardData,
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

async function checkAnswer(req, res) {
  try {
    const { answer, id } = req.headers;
    const result = await Arts.findOne({ _id: id });

    console.log(result, "result");
    if (!result) {
      return res.status(404).json({
        isSuccess: false,
        message: "Something went wrong while fetching the art details",
      });
    }
    if (result.answer === String(answer)) {
      return res.status(200).json({
        isSuccess: true,
        message: "The entered answer is correct",
      });
    } else {
      return res.status(404).json({
        isSuccess: false,
        message: "The entered answer is incorrect",
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

async function userLoginWithMobile(req, res) {
  try {
    const { mobile, password } = req.headers;
    await User.findOne({ mobile }).then(async (response) => {
      if (!response) {
        res.status(404).send({
          isSuccess: false,
          message: "Mobile number is incorrect !!",
        });
        return;
      }

      if (!response?.password) {
        res.status(404).send({
          isSuccess: false,
          message:
            "You are not registered with mobile and password,Please try Google Authentication",
        });
        return;
      }
      const isMatch = await bcrypt.compare(password, adminData.password);
      if (!isMatch) {
        res.status(401).send({
          isSuccess: false,
          message: "Password is incorrect !!",
        });
        return;
      }
      const token = jwt.sign(
        {
          id: response._id,
          email: response.email,
          name: response?.name,
        },
        JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      res.status(200).send({
        isSuccess: true,
        message: "Login successful",
        token,
        name: response?.name,
        email: response?.email,
        picture: response?.picture,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function registerUserWithMobile(req, res) {
  try {
    console.log(req.body, "body");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  GoogleAuth,
  UserLogin,
  getUserDetails,
  googlepay,
  getGamesAndArts,
  checkAnswer,
  userLoginWithMobile,
  registerUserWithMobile,
};
