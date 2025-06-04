const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//     gender: { type: String },
//   otp: String,
//   otpExpires: Date,
//   isVerified: {
//     type: Boolean,
//     default: false,
//   }, profile: {
//     gender: String,
//     birthDate: Date,
//      age: Number,
//     ethnicity: String,
//     maritalStatus: String,
//     height: String,
//     bodyType: String,
//     hasKids: String,
//     wantsKids: String,
//     hereFor: String,
//     wouldRelocate: String,
//      vaccinationStatus: { type: String },
//     headline: String,
//      compliment: String,
//      about: String,
//       isHidden: { 
//     type: Boolean,
//     default: false 
//   },
//      media: [{
//     url: String,
//     publicId: String,
//     mediaType: { type: String, enum: ['image', 'video'] },
//     uploadedAt: { type: Date, default: Date.now }
//   }],
//      dealbreakers: {
//   type: [String],
  
//   default: []
// },profilephoto: String,          // Add this
//  profilephotoPublicId: String 

//   }, location: {
//     city: String,
//     state: String,
//     country: String
//   }, lastActive: { type: Date, default: Date.now },
//   isOnline: { type: Boolean, default: false },
//  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// }, { timestamps: true });


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String },
  otp: String,
  otpExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },isImgVerified: {
  type: Boolean,
  default: false,
},
  profile: {
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
    wouldRelocate: String,
    vaccinationStatus: { type: String },
    headline: String,
    compliment: String,
    about: String,
    isHidden: { 
      type: Boolean,
      default: false 
    },
    media: [{
      url: String,
      publicId: String,
      mediaType: { type: String, enum: ['image'] },
      uploadedAt: { type: Date, default: Date.now }
    }], video: [
        {
          url: String,
          publicId: String,
          mediaType: { type: String, enum: ["video"], default: "video" }, // Dedicated for videos
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    dealbreakers: {
      type: [String],
      default: []
    },
    profilephoto: String,
    profilephotoPublicId: String 
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  lastActive: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // In your userSchema
blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Add this new section for search preferences
  searchPreferences: {
    distanceSearch: {
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    seekingGender: String,
    ageRange: {
      min: Number,
      max: Number
    },
    ethnicity: [String],
    maritalStatus: [String],
    heightRange: {
      min: String,
      max: String
    },
    bodyType: [String],
    hasKids: String,
    wantsKids: [String],
    hereFor: [String],
    wouldRelocate: String,
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Automatically set isImgVerified based on image count
  if (this.profile && Array.isArray(this.profile.media)) {
    this.isImgVerified = this.profile.media.length > 4;
  }

  next();
});


// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};




module.exports = mongoose.model('User', userSchema);
