const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Stripe = require("stripe");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const User = require("../models/userModel");
const Cards = require("../models/cardModel");
const Arts = require("../models/artModel");
const Coupon = require("../models/couponModel");

const saltValue = 10;
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store OTPs temporarily (For production, use a database)
const otpStore = new Map();

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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function registerUserWithMobile(req, res) {
  try {
    const {mobile,password,otp,name} = req.body;    
    const userData = await User.findOne({mobile});
    if(userData){
      return res.status(404).json({isSuccess:false,
        message:"The mobil number is already registered, Please try to Login!!"
      })
    }else{
      const storedOtp = otpStore.get(String(mobile));
      if (storedOtp && storedOtp == otp) {
        const hashPassword = await bcrypt.hash(password, saltValue);
       const response =  await User.create({mobile,name,password:hashPassword});
       if(response){
        return res.status(200).json({
          isSuccess:true,
          message:"Registration Successful, Please Login."
        })
       }else{
        return res.status(404).json({
          isSuccess:false,
          message:"User Login failed, Please try after some time!"
        })
       }
       
      }else{
        res.status(400).json({ isSuccess: false, message: "Invalid OTP" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function purchaseArt(req, res) {
  try {
    const { quantity, id } = req.headers;
    const artData = await Arts.findOne({ _id: id });
    if (!artData) {
      return res.status(404).json({
        isSuccess: false,
        message: "Art data not found!!",
      });
    }
    const cardId = await Cards.findOne(
      { status: true, isDelete: false },
      { _id: 1 }
    );
    if (!cardId) {
      return res.status(404).json({
        isSuccess: false,
        message: "Active cards are unAvailable!!",
      });
    }

    const totalArtAmount = artData?.price * Number(quantity);
    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).json({
        isSuccess: false,
        message: "User data not found!!",
      });
    }

    // checking wallet amount with the total purchase amount
    if (userData.wallet < totalArtAmount) {
      return res.status(404).json({
        isSuccess: false,
        message: "No enough wallet amount to purchase the art !!",
      });
    }
    // check the user already brought the art or not
    const existingArt = userData.purchasedArts.find(
      (art) => art.artId.toString() === id.toString()
    );
    if (existingArt) {
      existingArt.count += Number(quantity);
      userData.wallet -= totalArtAmount;
      await userData.save();
    } else {
      await User.findByIdAndUpdate(
        { _id: req.user.id },
        {
          $push: {
            purchasedArts: {
              artId: id,
              count: Number(quantity),
            },
          },
          $inc: { wallet: -totalArtAmount },
        },
        { new: true }
      );
    }
    artData.purchaseCount += Number(quantity);
    await artData.save();

    const couponsToGenerate = [];
    // Generate unique coupons
    for (let i = 0; i < quantity; i++) {
      let uniqueCouponId;
      let couponExists;

      // Ensure uniqueness
      do {
        uniqueCouponId = uuidv4();
        couponExists = await Coupon.findOne({
          code: uniqueCouponId,
          cardId: cardId,
        });
      } while (couponExists);
      const newCoupon = new Coupon({
        code: uniqueCouponId,
        couponCard: cardId,
        userId: userData?._id, // Associate with the card
      });

      await newCoupon.save();
      couponsToGenerate.push(newCoupon._id);
    }
    // Add coupons to user
    if (couponsToGenerate.length > 0) {
      await User.findByIdAndUpdate(userData?._id, {
        $push: { coupons: { $each: couponsToGenerate } },
      });
    }

    return res
      .status(200)
      .json({ isSuccess: true, message: "Art purchased successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function changeUserProfileImage(req, res) {
  try {
    if (req.file && req.user.id) {
      const response = await User.updateOne(
        { _id: req.user.id },
        { $set: { picture: req.file.filename } }
      );
      if (response?.modifiedCount === 1) {
        const userData = await User.findOne(
          { _id: req.user.id },
          { name: 1, email: 1, picture: 1 }
        );
        return res.status(200).json({
          isSuccess: true,
          message: "Image uploaded successfully",
          userData,
        });
      }
    }
    return res.status(404).json({
      isSuccess: false,
      message: "Something went wrong!!",
    });
  } catch {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function getOtp(req, res) {
  const { mobile } = req.headers;
  const otp = Math.floor(1000 + Math.random() * 9000);
  try {
    otpStore.set(mobile, otp);
    const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;
    await client.messages
      .create({
        body: `Your OTP for verify mobile number in Lucky draw website: ${otp},Don't share your otp with others`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedMobile,
      })
      .then((message) => {
        return res
          .status(200)
          .json({ isSuccess: true, message: "OTP sent successfully!" });
      })
      .catch(() => {
        return res
          .status(404)
          .json({ isSuccess: false, message: "Error while sending otp" });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

async function updateMobileNumber(req, res) {
  try {
    const { otp, mobile } = req.body;
    const { id } = req.user;
    const storedOtp = otpStore.get(String(mobile));
    if (storedOtp && storedOtp == otp) {
      otpStore.delete(mobile);

      const response = await User.updateOne({ _id: id }, { $set: { mobile } });
      if (response?.modifiedCount === 1) {
        return res.status(200).json({
          isSuccess: true,
          message: "Mobile number updated successfully !",
        });
      }
    } else {
      res.status(400).json({ isSuccess: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal Server Error",
    });
  }
}

// function to get otp for email
async function getEmailOtp(req, res) {
  try {
    const { email } = req.headers;
    const userData = await User.findOne({ email });
    if (userData) {
      return res.status(404).json({
        isSuccess: false,
        message: "The email is already registered, Please try to login!",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, otp);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    };
    await transporter
      .sendMail(mailOptions)
      .then((response) => {
        if (response.messageId) {
          return res.status(200).json({
            isSuccess: true,
            message:
              "Otp sent successfully, Please check the given email address",
          });
        }
      })
      .catch(() => {
        return res.status(404).json({
          isSuccess: false,
          message: "Sending Otp failed, Please try after some time",
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

// function to register user with email
async function registerUserWithEmail(req, res) {
  try {
    const { email, name, password, otp } = req.body;
    const storedOtp = otpStore.get(String(email));
    if (storedOtp && storedOtp == otp) {
      const hashPassword = await bcrypt.hash(password, saltValue);
     const response =  await User.create({email,name,password:hashPassword});
     if(response){
      return res.status(200).json({
        isSuccess:true,
        message:"Registration Successful, Please Login."
      })
     }else{
      return res.status(404).json({
        isSuccess:false,
        message:"User Login failed, Please try after some time!"
      })
     }
     
    }else{
      res.status(400).json({ isSuccess: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
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
  purchaseArt,
  changeUserProfileImage,
  updateMobileNumber,
  getOtp,
  getEmailOtp,
  registerUserWithEmail,
};
