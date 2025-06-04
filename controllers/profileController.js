// controllers/profileController.js
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');
// controllers/blockController.js
const BlockedUser = require('../models/BlockedUser');



const upload = multer({ storage: multer.memoryStorage() }).single('profilePhoto');
// Replace the existing upload configuration with:
const mediaUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Max 10 files at once
  }
}).array('media', 10); // 'media' is the field name, 10 is max count

// New video upload middleware
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per video
    files: 1, // Single video upload
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
}).single("video"); // 'video' is the field name

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

    // Get current user's gender from either field
    const currentGender = currentUser.gender || currentUser.profile?.gender;
    
    // Ensure current gender exists
    if (!currentGender) {
      return res.status(400).json({ message: 'Current user gender not defined' });
    }

    // Determine opposite gender
    const oppositeGender = currentGender.toLowerCase() === 'male' ? 'female' : 'male';
    
    // Fetch users of opposite gender and verified
    const oppositeGenderUsers = await User.find({
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
      isVerified: true, // ✅ Only include verified users
      $or: [
        { gender: { $regex: new RegExp(`^${oppositeGender}$`, 'i') } }, // Case insensitive match
        { 'profile.gender': { $regex: new RegExp(`^${oppositeGender}$`, 'i') } }
      ]
    }).select('-password -otp -otpExpires'); // Exclude sensitive data

    console.log(`Found ${oppositeGenderUsers.length} opposite gender users for ${currentGender} user`);
    res.json(oppositeGenderUsers);
    
  } catch (error) {
    console.error('Error in getOtherUsers:', error);
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
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedMedia = [];

    for (const file of files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

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

    // Update user's media
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Push uploaded media
    user.profile.media.push(...uploadedMedia);

    // Count only images for verification
    const imageCount = user.profile.media.filter((m) => m.mediaType === 'image').length;

    // Update isImgVerified field based on image count
    user.isImgVerified = imageCount > 4;

    await user.save();

    res.status(200).json({
      message: 'Media uploaded successfully',
      media: uploadedMedia,
      isImgVerified: user.isImgVerified
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

    // Update isImgVerified: true if more than 4 images remain
    const imageCount = user.profile.media.filter(m => m.mediaType === 'image').length;
    user.isImgVerified = imageCount > 4;

    await user.save();

    res.status(200).json({ 
      message: 'Media deleted successfully',
      isImgVerified: user.isImgVerified 
    });
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

// Get profile visibility status
exports.getProfileVisibility = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      isHidden: user.profile?.isHidden || false
    });

  } catch (err) {
    console.error('Error getting profile visibility:', err);
    res.status(500).json({ 
      message: 'Error getting profile status',
      error: err.message 
    });
  }
};

// Update profile visibility
exports.updateProfileVisibility = async (req, res) => {
  try {
    const { isHidden } = req.body;
    const userId = req.params.userId;

    // Explicitly set headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');

    const user = await User.findByIdAndUpdate(
      userId,
      { 'profile.isHidden': isHidden },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: `Profile ${isHidden ? 'hidden' : 'unhidden'} successfully`,
      isHidden: user.profile.isHidden
    });

  } catch (err) {
    console.error('Error updating profile visibility:', err);
    res.status(500).json({ 
      message: 'Error updating profile visibility',
      error: err.message 
    });
  }
};

// Video upload middleware handler
exports.videoUploadMiddleware = (req, res, next) => {
  videoUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Video file size too large (max 10MB)" });
      }
      return res.status(400).json({ message: "Video upload error" });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

exports.uploadVideo = async (req, res) => {
  try {
    const userId = req.params.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    // Get the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check video limit
    const currentVideos = user.profile?.video || [];
    if (currentVideos.length >= 3) {
      return res.status(400).json({ message: "You can only upload a maximum of 3 videos" });
    }

    // Prepare for upload
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    // Upload with video optimization settings
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "user-media/videos",
      resource_type: "video",
      format: "mp4", // Force MP4 output
      transformation: [
        { quality: "auto" }, // Automatic quality adjustment
        { fetch_format: "auto" }, // Best format for the browser
        { video_codec: "h264" }, // Standard H.264 codec
        { audio_codec: "aac" }, // Standard audio codec
        { flags: "splice" }, // Corrected flag for video concatenation (if needed)
      ],
      eager: [
        { 
          format: "mp4", 
          transformation: [
            { quality: 70 },
            { flags: "splice" } // Add flag here if needed for eager transformations
          ] 
        }
      ],
    });

    // Generate thumbnail URL - Cloudinary can generate this for you automatically
    const thumbnailUrl = result.secure_url.replace(/\.mp4$/, '.jpg');

    const videoData = {
      url: result.secure_url,
      publicId: result.public_id,
      mediaType: "video",
      uploadedAt: new Date(),
      thumbnail: thumbnailUrl,
      format: "mp4",
    };

    // Update user profile
    user.profile.video.push(videoData);
    await user.save();

    res.status(200).json({
      message: "Video uploaded and optimized successfully",
      video: videoData,
    });
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({
      message: "Error uploading video",
      error: err.message,
    });
  }
};
exports.deleteVideo = async (req, res) => {
  try {
    const { userId, publicId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find video in user's profile
    const videoIndex = user.profile.video.findIndex(vid => vid.publicId === publicId);
    if (videoIndex === -1) {
      return res.status(404).json({ message: "Video not found in user profile" });
    }

    // Extract full Cloudinary public ID (including folder if needed)
    const fullPublicId = user.profile.video[videoIndex].publicId;

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(fullPublicId, { 
      resource_type: "video",
      invalidate: true // Optional: purge from CDN cache
    });

    if (cloudinaryResult.result !== 'ok') {
      console.warn('Cloudinary deletion warning:', cloudinaryResult);
      // Continue with DB deletion even if Cloudinary fails
    }

    // Remove from DB
    user.profile.video.splice(videoIndex, 1);
    await user.save();

    res.status(200).json({ 
      message: "Video deleted successfully",
      cloudinaryResult
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ 
      message: "Failed to delete video",
      error: err.message,
      details: err.response?.data
    });
  }
};
exports.getUserVideos = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return the video array inside profile
    const videos = user.profile?.video || [];
    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ message: "Failed to get videos", error: err.message });
  }
};


exports.blockUser = async (req, res) => {
  try {
    console.log('=== BLOCK USER REQUEST ===');
    console.log('Request body:', req.body);
    
    const { blockerId, blockedId } = req.body;

    // Enhanced validation
    if (!blockerId || !blockedId) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Both blockerId and blockedId are required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(blockerId) || !mongoose.Types.ObjectId.isValid(blockedId)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Prevent self-blocking
    if (blockerId === blockedId) {
      console.log('Attempted self-blocking');
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    console.log('Checking if users exist...');
    // Check if users exist
    const [blocker, blocked] = await Promise.all([
      User.findById(blockerId),
      User.findById(blockedId)
    ]);

    console.log('Blocker found:', !!blocker);
    console.log('Blocked user found:', !!blocked);

    if (!blocker || !blocked) {
      console.log('One or both users not found');
      return res.status(404).json({
        success: false,
        message: 'One or both users not found'
      });
    }

    console.log('Checking for existing block...');
    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      blocker: blockerId,
      blocked: blockedId
    });

    console.log('Existing block found:', !!existingBlock);

    if (existingBlock) {
      console.log('User already blocked');
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    console.log('Creating new block...');
    // Create the block with explicit field mapping
    const blockData = {
      blocker: new mongoose.Types.ObjectId(blockerId),
      blocked: new mongoose.Types.ObjectId(blockedId)
    };

    console.log('Block data to save:', blockData);
    
    const newBlock = new BlockedUser(blockData);
    const savedBlock = await newBlock.save();

    console.log('Block saved successfully:', savedBlock);

    // Remove from likes/likedBy if they exist
    console.log('Removing from likes/likedBy...');
    const updateResults = await Promise.all([
      User.updateOne(
        { _id: blockerId, likes: blockedId },
        { $pull: { likes: blockedId } }
      ),
      User.updateOne(
        { _id: blockedId, likedBy: blockerId },
        { $pull: { likedBy: blockerId } }
      )
    ]);

    console.log('Update results:', updateResults);

    // Verify the block was saved
    const verification = await BlockedUser.findById(savedBlock._id);
    console.log('Verification - Block exists in DB:', !!verification);

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      data: savedBlock
    });

  } catch (error) {
    console.error('=== BLOCK ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    console.log('=== GET BLOCKED USERS ===');
    const { userId } = req.params;
    console.log('Getting blocked users for userId:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const blockedUsers = await BlockedUser.find({ blocker: userId })
      .populate('blocked', 'username profile.profilephoto email')
      .populate('blocker', 'username')
      .sort({ createdAt: -1 });

    console.log('Found blocked users:', blockedUsers.length);
    console.log('Blocked users data:', blockedUsers);

    res.status(200).json({
      success: true,
      message: 'Blocked users retrieved successfully',
      data: blockedUsers,
      count: blockedUsers.length
    });
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    console.log('=== UNBLOCK USER ===');
    const { blockerId, blockedId } = req.body;
    console.log('Unblock request:', { blockerId, blockedId });

    if (!blockerId || !blockedId) {
      return res.status(400).json({
        success: false,
        message: 'Both blockerId and blockedId are required'
      });
    }

    const result = await BlockedUser.deleteOne({
      blocker: blockerId,
      blocked: blockedId
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getLiveUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isOnline: true })
        .skip(skip)
        .limit(limit)
        .select('username profile')
        .lean(),
      User.countDocuments({ isOnline: true })
    ]);

    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};