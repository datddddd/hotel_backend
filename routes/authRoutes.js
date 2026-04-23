const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

module.exports = router;