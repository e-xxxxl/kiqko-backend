// controllers/userController.js

const User = require('../models/User');

exports.getOnlineCounts = async (req, res) => {
  try {
    // Calculate time threshold for "online" (e.g., last 5 minutes)
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    const counts = await User.aggregate([
      {
        $match: {
          $or: [
            { isOnline: true },
            { lastActive: { $gte: onlineThreshold } }
          ]
        }
      },
      {
        $group: {
          _id: "$profile.gender",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert the aggregation result to a more usable format
    const result = {
      women: 0,
      men: 0
    };

    counts.forEach(item => {
      if (item._id && item._id.toLowerCase() === 'female') {
        result.women = item.count;
      } else if (item._id && item._id.toLowerCase() === 'male') {
        result.men = item.count;
      }
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching online counts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};