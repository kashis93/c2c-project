const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, unique: true, lowercase: true, trim: true },
  department: { type: String, trim: true, default: '' },
  batch: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  passwordHash: String,
  isActive: { type: Boolean, default: false },
  isFirstLogin: { type: Boolean, default: true },
  isProfileComplete: { type: Boolean, default: false },
  role: { type: String, default: 'alumni' },

  // Temporary password for registration/reset
  temporaryPassword: String,
  temporaryPasswordExpires: Date,
  passwordResetSentAt: Date,

  // Profile photos stored on Cloudinary
  profilePicture: {
    type: String,
    default: null,
    alias: 'profilePhoto',
  },
  coverPhoto: {
    type: String,
    default: null,
  },

  // Additional profile info
  bio: { type: String, default: '' },
  location: { type: String, trim: true, default: '', alias: 'currentLocation' },
  title: { type: String, trim: true, default: '', alias: 'currentJobTitle' },
  company: { type: String, trim: true, default: '', alias: 'currentCompany' },
  skills: { type: [String], default: [] },
  socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
  workExperience: { type: [mongoose.Schema.Types.Mixed], default: [] },
  education: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.methods.toPublicProfile = function() {
  const userObject = this.toObject({ virtuals: true });
  delete userObject.passwordHash;
  delete userObject.temporaryPassword;
  delete userObject.temporaryPasswordExpires;
  delete userObject.passwordResetSentAt;

  const normalizedId = this._id.toString();
  const profilePhoto = userObject.profilePhoto || userObject.profilePicture || null;
  const currentJobTitle = userObject.currentJobTitle || userObject.title || '';
  const currentCompany = userObject.currentCompany || userObject.company || '';
  const currentLocation = userObject.currentLocation || userObject.location || '';

  return {
    ...userObject,
    _id: normalizedId,
    id: normalizedId,
    uid: normalizedId,
    profilePhoto,
    profilePicture: profilePhoto,
    currentJobTitle,
    title: currentJobTitle,
    currentCompany,
    company: currentCompany,
    currentLocation,
    location: currentLocation,
    phone: userObject.phone || '',
    displayName: userObject.name || '',
    photoURL: profilePhoto,
    skills: Array.isArray(userObject.skills) ? userObject.skills : [],
  };
};

module.exports = mongoose.model('User', userSchema);
