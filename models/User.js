const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  }, profile: {
    gender: String,
    birthDate: Date,
     age: Number,
    ethnicity: String,
    maritalStatus: String,
    height: String,
    bodyType: String,
    hasKids: String,
    wantsKids: String,
    hereFor: String,
    wouldRelocate: String
  }
}, { timestamps: true });
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
