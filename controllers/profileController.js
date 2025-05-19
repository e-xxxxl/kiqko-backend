// controllers/profileController.js
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');



const upload = multer({ storage: multer.memoryStorage() }).single('profilePhoto');

// Get user profile
exports.getProfile2 = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profile');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.profile || {});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const profileData = req.body;

    console.log('Updating user ID:', userId);
    console.log('Profile Data:', profileData);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profile: profileData } },
      { new: true }
    ).select('profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated User Profile:', user.profile); // Add this

    res.json(user.profile);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update only headline
exports.updateHeadline = async (req, res) => {
  try {
    const { userId } = req.params;
    const { headline } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Save headline in a new top-level field or within profile
    user.profile = { ...user.profile, headline }; // Adds headline to profile object
    await user.save();

    res.status(200).json({ message: 'Headline updated successfully', headline });
  } catch (error) {
    console.error('Headline update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update only compliment
exports.updateCompliment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { compliment } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profile = { ...user.profile, compliment }; // Save under profile
    await user.save();

    res.status(200).json({ message: 'Compliment updated successfully', compliment });
  } catch (error) {
    console.error('Compliment update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDealbreaker = async (req, res) => {
  const { id } = req.params;
  const { dealbreakers } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, {
  'profile.dealbreakers': dealbreakers,
}, { new: true });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating dealbreakers', error });
  }
};


exports.updateAbout = async (req, res) => {
  const { id } = req.params;
  const { about } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 'profile.about': about },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({ message: 'Error updating about info', error });
  }
};





// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to data URI for Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'profile-photos',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }
      ]
    });

    console.log("Cloudinary upload result:", result); // Debug log

    // Update user's profile photo in database
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        'profile.profilephoto': result.secure_url,
        'profile.profilephotoPublicId': result.public_id 
      },
      { new: true }
    );

    console.log("Updated user:", user); // Debug log

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      photoUrl: result.secure_url
    });
  } catch (err) {
    console.error('Profile photo upload error:', err);
    res.status(500).json({ 
      message: 'Error uploading profile photo',
      error: err.message 
    });
  }
};

// Middleware to handle file upload
exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error' });
    } else if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    next();
  });
};

// Delete profile photo
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete from Cloudinary if public_id exists
    if (user.profile.photoPublicId) {
      await cloudinary.uploader.destroy(user.profile.photoPublicId);
    }

    // Remove photo from user document
    user.profile.photo = undefined;
    user.profile.photoPublicId = undefined;
    await user.save();

    res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (err) {
    console.error('Profile photo delete error:', err);
    res.status(500).json({ message: 'Error deleting profile photo', error: err.message });
  }
};

// Get similar users
exports.getSimilarUsers = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get current user's profile
    const currentUser = await User.findById(userId).select('profile');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find similar users based on criteria
    const similarUsers = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        { 'profile.gender': currentUser.profile.lookingFor }, // Match gender preference
        { 'profile.age': { 
          $gte: currentUser.profile.minAgePreference || 18,
          $lte: currentUser.profile.maxAgePreference || 99
        }}
      ]
    })
    .limit(4)
    .select('username profile.photo profile.age profile.gender profile.city profile.country');
    
    res.json(similarUsers);
  } catch (err) {
    console.error('Error fetching similar users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get list of other users (excluding current user)
exports.getOtherUsers = async (req, res) => {
  console.log('getOtherUsers called with userId:', req.params.userId);
  try {
    const userId = req.params.userId;

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentGender = currentUser.gender || currentUser.profile?.gender;

    // Ensure current gender exists
    if (!currentGender) {
      return res.status(400).json({ message: 'Current user gender not defined' });
    }

    // Fetch users of opposite gender and verified
    const similarUsers = await User.find({
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
      isVerified: true, // ✅ Only include verified users
      $and: [
        { gender: { $ne: currentGender } },
        { 'profile.gender': { $ne: currentGender } }
      ]
    });

    res.json(similarUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get count of online users by gender
exports.getOnlineUsersCount = async (req, res) => {
  try {
    // This assumes you have a 'lastActive' field and 'gender' in your user model
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const counts = await User.aggregate([
      {
        $match: {
          lastActive: { $gte: fiveMinutesAgo }
        }
      },
      {
        $group: {
          _id: "$profile.gender",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array of counts to object
    const result = {
      women: 0,
      men: 0
    };

    counts.forEach(item => {
      if (item._id === 'Woman') result.women = item.count;
      if (item._id === 'Man') result.men = item.count;
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching online users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    const update = {
      isOnline,
      lastActive: isOnline ? new Date() : undefined
    };

    const user = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Online status updated',
      isOnline: user.isOnline,
      lastActive: user.lastActive
    });
  } catch (err) {
    console.error('Error updating online status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
