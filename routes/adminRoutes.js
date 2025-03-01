const express = require('express');
const { adminSignUp,adminLogin } = require('../controllers/adminController');

const router = express.Router()

router.post('/signUp',adminSignUp)
router.get('/login',adminLogin)

module.exports = router;
