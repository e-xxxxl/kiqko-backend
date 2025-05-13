const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');



router.get('/profile/:id', userController.getUserProfile);
router.put('/:userId', profileController.updateProfile);
router.get('/profilee/:userId', profileController.getProfile2); // Make sure this line is present

module.exports = router;
