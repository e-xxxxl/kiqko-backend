const express = require('express');
const router = express.Router();
const { register, verifyEmail,resendVerificationEmail,verifyEmailWithOtp, login } = require('../controllers/authController');

router.post('/signup', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-email', resendVerificationEmail);
router.post('/verify-email', verifyEmailWithOtp);
router.post('/login', login);

module.exports = router;
