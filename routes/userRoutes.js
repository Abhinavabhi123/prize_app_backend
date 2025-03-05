const express = require("express");
const { GoogleAuth, UserLogin } = require("../controllers/userController");

const router = express.Router()

router.post("/googleAuth",GoogleAuth);
router.get('/userLogin',UserLogin)

module.exports = router;