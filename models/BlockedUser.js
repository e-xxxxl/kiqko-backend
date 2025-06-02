const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness and improve query performance
blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Prevent self-blocking
blockedUserSchema.pre('save', function(next) {
  if (this.blocker.toString() === this.blocked.toString()) {
    const error = new Error('Cannot block yourself');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
