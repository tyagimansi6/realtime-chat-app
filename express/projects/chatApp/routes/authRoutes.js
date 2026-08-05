const router = require('express').Router();
const authDB = require('../config/db')(); // Connection-scoped

const User = require('../models/User')(authDB);
const PasswordResetToken = require('../models/PasswordResetToken')(authDB);

// Inject models into controller
const authController = require('../controllers/authController')({ User, PasswordResetToken });

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/sendResetMail', authController.sendResetMail);
router.post('/resetPassword', authController.resetPassword);
router.post('/validate', authController.validateUser);
router.post('/logout', authController.logOut);

module.exports = router;
