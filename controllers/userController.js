const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

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
        { id: userData._id, email: userData.email },
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
  }
}

async function UserLogin(req, res) {
  try {
    const { email, password } = req.headers;
    console.log(email, "email");

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
          email: response?.email,
          picture: response?.picture,
        },
        JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      res
        .status(200)
        .send({
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
  }
}

module.exports = {
  GoogleAuth,
  UserLogin,
};
