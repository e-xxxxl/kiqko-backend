const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const onlineController = require('../controllers/onlineController');
const User = require('../models/User'); // adjust path if different
const ProfileView = require('../models/ProfileView');
const mongoose = require('mongoose');


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


// POST /api/users/profile-view
router.post("/profile-view", async (req, res) => {
  const { viewerId, viewedUserId } = req.body;

  // Log the incoming request for debugging
  console.log("Profile view request received:", req.body);

  // Validate request
  if (!viewerId || !viewedUserId) {
    console.log("Validation failed: Missing viewerId or viewedUserId");
    return res.status(400).json({ message: "viewerId and viewedUserId are required" });
  }

  if (viewerId === viewedUserId) {
    console.log("Validation failed: Self-view attempted");
    return res.status(400).json({ message: "Cannot record self-view" });
  }

  try {
    // Optional: Check for existing view to avoid duplicates (e.g., within 24 hours)
    const existingView = await ProfileView.findOne({
      viewerId,
      viewedUserId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    console.log("Existing view check:", existingView);

    if (existingView) {
      console.log("View already recorded recently");
      return res.status(200).json({ message: "View already recorded recently" });
    }

    // Save new profile view
    const profileView = new ProfileView({
      viewerId,
      viewedUserId,
      timestamp: new Date(),
    });
    console.log("Attempting to save profile view:", profileView);
    await profileView.save();
    console.log("Profile view saved successfully");

    res.status(200).json({ message: "Profile view recorded successfully" });
  } catch (err) {
    console.error("Error recording profile view:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/users/:userId/profile-viewers
router.get("/:userId/profile-viewers", async (req, res) => {
  const { userId } = req.params;

  try {
    const views = await ProfileView.find({ viewedUserId: userId })
      .sort({ timestamp: -1 })
      .select("viewerId");

    const viewerIds = views.map(view => view.viewerId);

    res.status(200).json(viewerIds);
  } catch (err) {
    res.status(500).json({ message: "Error fetching viewer IDs", error: err.message });
  }
});



router.post('/search-filters', async (req, res) => {
  try {
    const { userId, distance, seeking, ageRange, ethnicity, maritalStatus, height, bodyType, haveKids, wantKids, hereFor, relocate } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Normalize array fields
    const normalizeArray = (field) => (Array.isArray(field) ? field : typeof field === 'string' ? [field] : []);

    // Prepare the searchPreferences object
    const searchPreferences = {
      distanceSearch: {
        city: distance?.city || '',
        state: distance?.state || '',
        country: distance?.country || '',
        zipCode: distance?.zipCode || '',
      },
      seekingGender: seeking || '',
      ageRange: {
        min: ageRange?.min || 18,
        max: ageRange?.max || 80,
      },
      ethnicity: normalizeArray(ethnicity),
      maritalStatus: normalizeArray(maritalStatus),
      heightRange: {
        min: height?.min || '',
        max: height?.max || '',
      },
      bodyType: normalizeArray(bodyType),
      hasKids: haveKids || '',
      wantsKids: normalizeArray(wantKids),
      hereFor: normalizeArray(hereFor),
      wouldRelocate: relocate || '',
      lastUpdated: new Date(),
    };

    // Update the user's searchPreferences in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { searchPreferences } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Search filters saved successfully', user: updatedUser });
  } catch (error) {
    console.error('Error saving search filters:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router;
