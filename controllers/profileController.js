// controllers/profileController.js
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');



const upload = multer({ storage: multer.memoryStorage() }).single('profilePhoto');
// Replace the existing upload configuration with:
const mediaUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Max 10 files at once
  }
}).array('media', 10); // 'media' is the field name, 10 is max count

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
    const profileUpdates = req.body;

    console.log('Updating user ID:', userId);
    console.log('Profile Updates:', profileUpdates);

    // Create an update object with only the fields that need to be updated
    const updateFields = {};
    Object.keys(profileUpdates).forEach(field => {
      updateFields[`profile.${field}`] = profileUpdates[field];
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated User Profile:', user.profile);

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
    if (user.profile.profilephotoPublicId) {
      await cloudinary.uploader.destroy(user.profile.profilephotoPublicId);
    }

    // Remove photo from user document
    user.profile.profilephoto = undefined;
    user.profile.profilephotoPublicId = undefined;
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


// Upload media
exports.uploadMedia = async (req, res) => {
  try {
    const userId = req.params.userId;
    const files = req.files; // Using multer's array upload
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedMedia = [];
    
    // Process each file
    for (const file of files) {
      // Convert buffer to data URI for Cloudinary
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = "data:" + file.mimetype + ";base64," + b64;

      // Determine resource type based on mimetype
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'user-media',
        resource_type: resourceType
      });

      uploadedMedia.push({
        url: result.secure_url,
        publicId: result.public_id,
        mediaType: resourceType
      });
    }

    // Update user's media array
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { 'profile.media': { $each: uploadedMedia } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Media uploaded successfully',
      media: uploadedMedia
    });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ 
      message: 'Error uploading media',
      error: err.message 
    });
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  try {
    const { userId, mediaId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the media to delete
    const mediaItem = user.profile.media.id(mediaId);
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(mediaItem.publicId, {
      resource_type: mediaItem.mediaType === 'video' ? 'video' : 'image'
    });

    // Remove from user's media array
    user.profile.media.pull(mediaId);
    await user.save();

    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (err) {
    console.error('Media delete error:', err);
    res.status(500).json({ 
      message: 'Error deleting media',
      error: err.message 
    });
  }
};

// Get user media
exports.getUserMedia = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profile.media');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.profile.media || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update media order/arrangement
exports.updateMediaOrder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { mediaIds } = req.body; // Array of media IDs in new order

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a map for quick lookup
    const mediaMap = new Map();
    user.profile.media.forEach(item => mediaMap.set(item._id.toString(), item));

    // Rebuild the media array in the new order
    const newMediaArray = mediaIds.map(id => mediaMap.get(id)).filter(Boolean);

    user.profile.media = newMediaArray;
    await user.save();

    res.status(200).json({ message: 'Media order updated successfully' });
  } catch (err) {
    console.error('Media order update error:', err);
    res.status(500).json({ 
      message: 'Error updating media order',
      error: err.message 
    });
  }
};

// Media upload middleware
exports.mediaUploadMiddleware = (req, res, next) => {
  mediaUpload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large (max 10MB)' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files (max 10)' });
      }
      return res.status(400).json({ message: 'File upload error' });
    } else if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    next();
  });
};