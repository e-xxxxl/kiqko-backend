// Backend: models/ProfileView.js
const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema({
  viewerId: {
    type: String,
    required: true,
    index: true, // Improve query performance
  },
  viewedUserId: {
    type: String,
    required: true,
    index: true, // Improve query performance
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Improve queries by timestamp
  },
});

module.exports = mongoose.model("ProfileView", profileViewSchema);