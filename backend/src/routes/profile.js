/**
 * Profile Photos Routes - Handle Profile Picture & Cover Photo Updates
 * Endpoints for updating profile pictures and cover photos from Cloudinary URLs
 * PUT /api/profile/:userId/picture
 * PUT /api/profile/:userId/cover
 */

const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/authMiddleware-new');
const User = require('../models/User');

const router = express.Router();

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ [DATABASE] Request received but database is not connected.');
    return true; 
  }
  return true;
};

/**
 * PUT /api/profile/:userId/picture
 * Update user's profile picture
 * Body: { profilePicture: "https://res.cloudinary.com/..." }
 */
router.put('/:userId/picture', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { userId } = req.params;
    const { profilePicture } = req.body;

    // Verify user can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Cannot update other user profiles' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate URL is from Cloudinary
    if (profilePicture && !profilePicture.includes('cloudinary')) {
      return res.status(400).json({ 
        message: 'Invalid image URL. Must be from Cloudinary.',
        example: 'https://res.cloudinary.com/dv0heb3cz/image/upload/...'
      });
    }

    // Update user profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicture || null },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ BROADCAST: Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    io.emit('profile-picture-updated', {
      userId,
      profilePicture: updatedUser.profilePicture,
      name: updatedUser.name,
      timestamp: new Date()
    });

    console.log(`✅ Profile picture updated for user ${userId}`);
    console.log(`📡 Broadcasting to all users: profile-picture-updated`);

    res.json({
      message: 'Profile picture updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Failed to update profile picture', error: error.message });
  }
});

/**
 * PUT /api/profile/:userId/cover
 * Update user's cover photo
 * Body: { coverPhoto: "https://res.cloudinary.com/..." }
 */
router.put('/:userId/cover', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { userId } = req.params;
    const { coverPhoto } = req.body;

    // Verify user can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Cannot update other user profiles' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate URL is from Cloudinary
    if (coverPhoto && !coverPhoto.includes('cloudinary')) {
      return res.status(400).json({ 
        message: 'Invalid image URL. Must be from Cloudinary.',
        example: 'https://res.cloudinary.com/dv0heb3cz/image/upload/...'
      });
    }

    // Update user cover photo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { coverPhoto: coverPhoto || null },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ BROADCAST: Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    io.emit('cover-photo-updated', {
      userId,
      coverPhoto: updatedUser.coverPhoto,
      name: updatedUser.name,
      timestamp: new Date()
    });

    console.log(`✅ Cover photo updated for user ${userId}`);
    console.log(`📡 Broadcasting to all users: cover-photo-updated`);

    res.json({
      message: 'Cover photo updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        coverPhoto: updatedUser.coverPhoto
      }
    });
  } catch (error) {
    console.error('Error updating cover photo:', error);
    res.status(500).json({ message: 'Failed to update cover photo', error: error.message });
  }
});

/**
 * GET /api/profile/:userId
 * Get user profile with all photos and posts
 */
router.get('/:userId', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const Blog = require('../models/Blog');
    const posts = await Blog.find({ authorId: userId, type: 'post' })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name profilePicture')
      .lean();

    res.json({
      ...user,
      posts: posts || [],
      postsCount: posts?.length || 0,
      pictures: {
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;
