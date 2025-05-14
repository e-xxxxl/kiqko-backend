const express = require('express');
const router = express.Router();
const { register, verifyEmail,resendVerificationEmail,verifyEmailWithOtp, login, resetPassword } = require('../controllers/authController');

router.post('/signup', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-email', resendVerificationEmail);
router.post('/verify-email', verifyEmailWithOtp);
router.post('/login', login);
router.post('/reset-password', resetPassword); // Add this new route

module.exports = router;
