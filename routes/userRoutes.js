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

// router.get('/similar/:userId', profileController.getSimilarUsers);

router.get('/similar/:userId', profileController.getOtherUsers)
router.get('/online-count', profileController.getOnlineUsersCount);
router.put('/online-status/:userId', profileController.updateOnlineStatus);


router.get('/similar-users/:userId', profileController.getOtherUsers);



// Media routes
router.post('/:userId/media', 
  profileController.mediaUploadMiddleware, 
  profileController.uploadMedia
);

router.delete('/:userId/media/:mediaId', 
  profileController.deleteMedia
);

router.get('/:userId/media', 
  profileController.getUserMedia
);

router.put('/:userId/media/order', 
  profileController.updateMediaOrder
); 


router.get('/:userId/profile-status', profileController.getProfileVisibility);
router.put('/:userId/hide-profile', profileController.updateProfileVisibility);
module.exports = router;
