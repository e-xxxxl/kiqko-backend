const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const onlineController = require('../controllers/onlineController');
const User = require('../models/User'); // adjust path if different


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


router.post('/:userId/like', async (req, res) => {
  try {
    const currentUserId = req.body.userId;
    const targetUserId = req.params.userId;

    console.log('currentUserId:', currentUserId);
    console.log('targetUserId:', targetUserId);
    console.log('req.body:', req.body);
    console.log('req.params:', req.params);

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ message: 'Missing user ID.' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You can't like yourself." });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (currentUser.likes.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already liked this user.' });
    }

    currentUser.likes.push(targetUserId);
    targetUser.likedBy.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: 'User liked successfully.' });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/likes/:userId
router.get('/likes/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('likes');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.likes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/liked-by/:userId
router.get('/liked-by/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('likedBy', 'username profile.profilephoto createdAt');
    res.json(user.likedBy);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users who liked you' });
  }
});

// routes/user.js
router.post('/vaccination-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccinationStatus } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { 'profile.vaccinationStatus': vaccinationStatus },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Vaccination status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
