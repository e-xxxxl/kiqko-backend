// controllers/profileController.js
const User = require('../models/User');

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
