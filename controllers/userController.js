const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');


exports.getUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).select('username email'); // select only needed fields
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // First check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Perform deletion
    await User.findByIdAndDelete(userId);

    // Return proper JSON response
    res.status(200).json({ 
      success: true,
      message: 'Account deleted successfully' 
    });

  } catch (err) {
    console.error('Delete error:', err);
    // Ensure we always return JSON
    res.status(500).json({ 
      success: false,
      message: 'Server error during deletion',
      error: err.message 
    });
  }
};


exports.updateLocation = async (req, res) => {
  const { city, state, country } = req.body;
  const { userId } = req.params;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          city,
          state,
          country
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Location updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserLocation = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('location');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.location);
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
