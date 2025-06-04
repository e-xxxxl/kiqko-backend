const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const onlineController = require('../controllers/onlineController');
const User = require('../models/User'); // adjust path if different
const ProfileView = require('../models/ProfileView');
const mongoose = require('mongoose');



router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('createdAt lastActive');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Fetched user:', user); // Debug: Log the user data
    res.json({
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
// Video upload route
router.post(
  "/:userId/video",
  profileController.videoUploadMiddleware,
  profileController.uploadVideo
);
router.delete("/:userId/video/:publicId", profileController.deleteVideo);


 router.get("/:userId/getVideos", profileController.getUserVideos);
// Block user routes
router.post('/block-user', profileController.blockUser);
router.get('/blocked-users/:userId', profileController.getBlockedUsers);
router.delete('/unblock-user', profileController.unblockUser);

router.get('/live-users', profileController.getLiveUsers);



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


router.get('/search-matches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const searchPrefs = user.searchPreferences;

    // Build query for matching users
    const query = {
      _id: { $ne: userId }, // Exclude the current user
      'profile.isHidden': false, // Only include visible profiles
      $and: [], // To store conditions for at least two matches
    };

    // Helper function to add conditions to query
    const conditions = [];

    // Add search criteria if they exist in searchPreferences
    if (searchPrefs.seekingGender) {
      conditions.push({ 'profile.gender': searchPrefs.seekingGender });
    }
    if (searchPrefs.ageRange?.min || searchPrefs.ageRange?.max) {
      conditions.push({
        'profile.age': {
          $gte: searchPrefs.ageRange.min || 18,
          $lte: searchPrefs.ageRange.max || 80,
        },
      });
    }
    if (searchPrefs.ethnicity?.length) {
      conditions.push({ 'profile.ethnicity': { $in: searchPrefs.ethnicity } });
    }
    if (searchPrefs.maritalStatus?.length) {
      conditions.push({ 'profile.maritalStatus': { $in: searchPrefs.maritalStatus } });
    }
    if (searchPrefs.heightRange?.min || searchPrefs.heightRange?.max) {
      conditions.push({
        'profile.height': {
          $gte: searchPrefs.heightRange.min || '0',
          $lte: searchPrefs.heightRange.max || '999',
        },
      });
    }
    if (searchPrefs.bodyType?.length) {
      conditions.push({ 'profile.bodyType': { $in: searchPrefs.bodyType } });
    }
    if (searchPrefs.hasKids) {
      conditions.push({ 'profile.hasKids': searchPrefs.hasKids });
    }
    if (searchPrefs.wantsKids?.length) {
      conditions.push({ 'profile.wantsKids': { $in: searchPrefs.wantsKids } });
    }
    if (searchPrefs.hereFor?.length) {
      conditions.push({ 'profile.hereFor': { $in: searchPrefs.hereFor } });
    }
    if (searchPrefs.wouldRelocate) {
      conditions.push({ 'profile.wouldRelocate': searchPrefs.wouldRelocate });
    }
    if (searchPrefs.distanceSearch?.city || searchPrefs.distanceSearch?.state || searchPrefs.distanceSearch?.country) {
      const locationConditions = [];
      if (searchPrefs.distanceSearch.city) {
        locationConditions.push({ 'location.city': searchPrefs.distanceSearch.city });
      }
      if (searchPrefs.distanceSearch.state) {
        locationConditions.push({ 'location.state': searchPrefs.distanceSearch.state });
      }
      if (searchPrefs.distanceSearch.country) {
        locationConditions.push({ 'location.country': searchPrefs.distanceSearch.country });
      }
      if (locationConditions.length > 0) {
        conditions.push({ $or: locationConditions });
      }
    }

    // Ensure at least two criteria match
    if (conditions.length >= 2) {
      query.$and.push({ $or: conditions });
    } else {
      // If fewer than 2 criteria, return empty results
      return res.status(200).json({ matches: [] });
    }

    const matches = await User.find(query).select(
      'username profile location'
    );

    // Calculate match percentage for each user
    const matchesWithPercentage = matches.map(match => {
      let matchCount = 0;
      let totalCriteria = 0;

      // Helper function to check if criterion matches
      const checkCriterion = (userValue, searchValue, isArray = false, isRange = false) => {
        if (!searchValue || (Array.isArray(searchValue) && !searchValue.length)) return false;
        totalCriteria++;
        if (isRange) {
          return userValue >= (searchValue.min || 0) && userValue <= (searchValue.max || Infinity);
        }
        if (isArray) {
          return Array.isArray(userValue) ? userValue.some(val => searchValue.includes(val)) : searchValue.includes(userValue);
        }
        return userValue === searchValue;
      };

      // Count matching criteria
      if (checkCriterion(match.profile?.gender, searchPrefs.seekingGender)) matchCount++;
      if (checkCriterion(match.profile?.age, searchPrefs.ageRange, false, true)) matchCount++;
      if (checkCriterion(match.profile?.ethnicity, searchPrefs.ethnicity, true)) matchCount++;
      if (checkCriterion(match.profile?.maritalStatus, searchPrefs.maritalStatus, true)) matchCount++;
      if (checkCriterion(match.profile?.height, searchPrefs.heightRange, false, true)) matchCount++;
      if (checkCriterion(match.profile?.bodyType, searchPrefs.bodyType, true)) matchCount++;
      if (checkCriterion(match.profile?.hasKids, searchPrefs.hasKids)) matchCount++;
      if (checkCriterion(match.profile?.wantsKids, searchPrefs.wantsKids, true)) matchCount++;
      if (checkCriterion(match.profile?.hereFor, searchPrefs.hereFor, true)) matchCount++;
      if (checkCriterion(match.profile?.wouldRelocate, searchPrefs.wouldRelocate)) matchCount++;
      if (
        checkCriterion(match.location?.city, searchPrefs.distanceSearch?.city) ||
        checkCriterion(match.location?.state, searchPrefs.distanceSearch?.state) ||
        checkCriterion(match.location?.country, searchPrefs.distanceSearch?.country)
      ) matchCount++;

      const matchPercentage = totalCriteria ? (matchCount / totalCriteria) * 100 : 0;

      // Only include matches with at least 2 criteria matching
      if (matchCount >= 2) {
        return {
          ...match.toObject(),
          matchPercentage: Math.round(matchPercentage),
        };
      }
      return null;
    }).filter(match => match !== null);

    // Sort matches by percentage (descending)
    matchesWithPercentage.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({ matches: matchesWithPercentage });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.get('/search-matches/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: 'Invalid user ID' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const searchPrefs = user.searchPreferences;

//     // Ensure seekingGender is specified
//     if (!searchPrefs.seekingGender) {
//       return res.status(400).json({ message: 'Gender preference is required for matching' });
//     }

//     // Build query for matching users
//     const query = {
//       _id: { $ne: userId }, // Exclude the current user
//       'profile.isHidden': false, // Only include visible profiles
//       'profile.gender': searchPrefs.seekingGender, // Mandatory gender match
//       $and: [], // To store conditions for additional matches
//     };

//     // Helper function to add conditions to query
//     const conditions = [];

//     // Add other search criteria if they exist in searchPreferences
//     if (searchPrefs.ageRange?.min || searchPrefs.ageRange?.max) {
//       conditions.push({
//         'profile.age': {
//           $gte: searchPrefs.ageRange.min || 18,
//           $lte: searchPrefs.ageRange.max || 80,
//         },
//       });
//     }
//     if (searchPrefs.ethnicity?.length) {
//       conditions.push({ 'profile.ethnicity': { $in: searchPrefs.ethnicity } });
//     }
//     if (searchPrefs.maritalStatus?.length) {
//       conditions.push({ 'profile.maritalStatus': { $in: searchPrefs.maritalStatus } });
//     }
//     if (searchPrefs.heightRange?.min || searchPrefs.heightRange?.max) {
//       conditions.push({
//         'profile.height': {
//           $gte: searchPrefs.heightRange.min || '0',
//           $lte: searchPrefs.heightRange.max || '999',
//         },
//       });
//     }
//     if (searchPrefs.bodyType?.length) {
//       conditions.push({ 'profile.bodyType': { $in: searchPrefs.bodyType } });
//     }
//     if (searchPrefs.hasKids) {
//       conditions.push({ 'profile.hasKids': searchPrefs.hasKids });
//     }
//     if (searchPrefs.wantsKids?.length) {
//       conditions.push({ 'profile.wantsKids': { $in: searchPrefs.wantsKids } });
//     }
//     if (searchPrefs.hereFor?.length) {
//       conditions.push({ 'profile.hereFor': { $in: searchPrefs.hereFor } });
//     }
//     if (searchPrefs.wouldRelocate) {
//       conditions.push({ 'profile.wouldRelocate': searchPrefs.wouldRelocate });
//     }
//     if (searchPrefs.distanceSearch?.city || searchPrefs.distanceSearch?.state || searchPrefs.distanceSearch?.country) {
//       const locationConditions = [];
//       if (searchPrefs.distanceSearch.city) {
//         locationConditions.push({ 'location.city': searchPrefs.distanceSearch.city });
//       }
//       if (searchPrefs.distanceSearch.state) {
//         locationConditions.push({ 'location.state': searchPrefs.distanceSearch.state });
//       }
//       if (searchPrefs.distanceSearch.country) {
//         locationConditions.push({ 'location.country': searchPrefs.distanceSearch.country });
//       }
//       if (locationConditions.length > 0) {
//         conditions.push({ $or: locationConditions });
//       }
//     }

//     // Ensure at least one additional criterion matches (since gender is mandatory)
//     if (conditions.length >= 1) {
//       query.$and.push({ $or: conditions });
//     } else {
//       // If no additional criteria are specified, return empty results
//       return res.status(200).json({ matches: [] });
//     }

//     const matches = await User.find(query).select(
//       'username profile location'
//     );

//     // Calculate match percentage for each user
//     const matchesWithPercentage = matches.map(match => {
//       let matchCount = 0;
//       let totalCriteria = 0;

//       // Helper function to check if criterion matches
//       const checkCriterion = (userValue, searchValue, isArray = false, isRange = false) => {
//         if (!searchValue || (Array.isArray(searchValue) && !searchValue.length)) return false;
//         totalCriteria++;
//         if (isRange) {
//           return userValue >= (searchValue.min || 0) && userValue <= (searchValue.max || Infinity);
//         }
//         if (isArray) {
//           return Array.isArray(userValue) ? userValue.some(val => searchValue.includes(val)) : searchValue.includes(userValue);
//         }
//         return userValue === searchValue;
//       };

//       // Count matching criteria
//       // Gender is always a match due to query, so count it
//       matchCount++;
//       totalCriteria++;
//       if (checkCriterion(match.profile?.age, searchPrefs.ageRange, false, true)) matchCount++;
//       if (checkCriterion(match.profile?.ethnicity, searchPrefs.ethnicity, true)) matchCount++;
//       if (checkCriterion(match.profile?.maritalStatus, searchPrefs.maritalStatus, true)) matchCount++;
//       if (checkCriterion(match.profile?.height, searchPrefs.heightRange, false, true)) matchCount++;
//       if (checkCriterion(match.profile?.bodyType, searchPrefs.bodyType, true)) matchCount++;
//       if (checkCriterion(match.profile?.hasKids, searchPrefs.hasKids)) matchCount++;
//       if (checkCriterion(match.profile?.wantsKids, searchPrefs.wantsKids, true)) matchCount++;
//       if (checkCriterion(match.profile?.hereFor, searchPrefs.hereFor, true)) matchCount++;
//       if (checkCriterion(match.profile?.wouldRelocate, searchPrefs.wouldRelocate)) matchCount++;
//       if (
//         checkCriterion(match.location?.city, searchPrefs.distanceSearch?.city) ||
//         checkCriterion(match.location?.state, searchPrefs.distanceSearch?.state) ||
//         checkCriterion(match.location?.country, searchPrefs.distanceSearch?.country)
//       ) matchCount++;

//       const matchPercentage = totalCriteria ? (matchCount / totalCriteria) * 100 : 0;

//       // Since gender is mandatory and we need at least one more criterion, matchCount >= 2 is ensured
//       return {
//         ...match.toObject(),
//         matchPercentage: Math.round(matchPercentage),
//       };
//     });

//     // Sort matches by percentage (descending)
//     matchesWithPercentage.sort((a, b) => b.matchPercentage - a.matchPercentage);

//     res.status(200).json({ matches: matchesWithPercentage });
//   } catch (error) {
//     console.error('Error fetching matches:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });




module.exports = router;
