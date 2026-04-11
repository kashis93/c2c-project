/**
 * File Upload Routes - Handle Image Uploads to Cloudinary
 * POST /api/upload/profile-picture
 * POST /api/upload/cover-photo
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/authMiddleware-new');
const User = require('../models/User');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * POST /api/upload/profile-picture
 * Upload and update user's profile picture
 */
router.post('/profile-picture', requireAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get current user to check for existing profile picture
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file, 'alumni-platform/profile-pictures');

    // Delete old profile picture from Cloudinary if it exists
    if (currentUser.profilePicture) {
      try {
        const publicId = currentUser.profilePicture.split('/').pop().split('.')[0];
        await deleteImage(`alumni-platform/profile-pictures/${publicId}`);
      } catch (error) {
        console.log('Could not delete old profile picture:', error.message);
      }
    }

    // Update user's profile picture in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true }
    ).select('-passwordHash');

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    io.emit('profile-picture-updated', {
      userId,
      profilePicture: uploadResult.url,
      name: updatedUser.name,
      timestamp: new Date()
    });

    console.log(`✅ Profile picture uploaded for user ${userId}`);

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: uploadResult.url,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      message: 'Failed to upload profile picture', 
      error: error.message 
    });
  }
});

/**
 * POST /api/upload/cover-photo
 * Upload and update user's cover photo
 */
router.post('/cover-photo', requireAuth, upload.single('coverPhoto'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get current user to check for existing cover photo
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file, 'alumni-platform/cover-photos');

    // Delete old cover photo from Cloudinary if it exists
    if (currentUser.coverPhoto) {
      try {
        const publicId = currentUser.coverPhoto.split('/').pop().split('.')[0];
        await deleteImage(`alumni-platform/cover-photos/${publicId}`);
      } catch (error) {
        console.log('Could not delete old cover photo:', error.message);
      }
    }

    // Update user's cover photo in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { coverPhoto: uploadResult.url },
      { new: true }
    ).select('-passwordHash');

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    io.emit('cover-photo-updated', {
      userId,
      coverPhoto: uploadResult.url,
      name: updatedUser.name,
      timestamp: new Date()
    });

    console.log(`✅ Cover photo uploaded for user ${userId}`);

    res.json({
      message: 'Cover photo uploaded successfully',
      coverPhoto: uploadResult.url,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        coverPhoto: updatedUser.coverPhoto
      }
    });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      message: 'Failed to upload cover photo', 
      error: error.message 
    });
  }
});

module.exports = router;
