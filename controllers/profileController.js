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



