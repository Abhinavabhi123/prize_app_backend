const bcrypt = require("bcrypt");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

const saltValue = 10;
async function adminSignUp(req, res) {
  try {
    const { email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, saltValue);
    await Admin.create({ email, password: hashPassword }).then(() =>
      res.status(200).send({ isSuccess: true, message: "Admin Login Success" })
    );
    console.log(hashPassword, "password");
  } catch (error) {
    res.status(404).send({ isSuccess: false, message: "Admin Login failed" });
    console.error(error);
  }
}

async function adminLogin(req, res) {
  try {
    const { data } = req.headers;
    const {email,password} = JSON.parse(data);
    const adminData = await Admin.findOne({ email });
    console.log(adminData, "data");
    if (!adminData) {
      return res.status(404).json({ message: "User not found, Please check the email!" });
    }

    const isMatch = await bcrypt.compare(
      password,
      adminData.password
    );
    if (!isMatch) {

      res.status(401).send({isSuccess:false, message: "Invalid password!!" });
    }
    const token = jwt.sign({ id: adminData._id, email: adminData.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).send({isSuccess:true, message: "Login successful",token });

    console.log(verifyPass, "verified");
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  adminSignUp,
  adminLogin,
};
