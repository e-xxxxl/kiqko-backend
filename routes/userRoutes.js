const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const onlineController = require('../controllers/onlineController');


router.get('/profile/:id', userController.getUserProfile);
router.delete('/delete/:id', userController.deleteUser);
router.put('/:userId', profileController.updateProfile);
router.get('/profilee/:userId', profileController.getProfile2); // Make sure this line is present
router.post('/update-location/:userId', userController.updateLocation);
router.get('/location/:userId', userController.getUserLocation);
router.post('/headline/:userId', profileController.updateHeadline);
router.post('/compliment/:userId', profileController.updateCompliment);
router.post('/dealbreaker/:id', profileController.updateDealbreaker);
router.post('/about/:id', profileController.updateAbout);

router.post(
  '/upload-photo/:userId',
  profileController.uploadMiddleware,
  profileController.uploadProfilePhoto
);

router.delete(
  '/delete-photo/:userId',
  profileController.deleteProfilePhoto
);

module.exports = router;
