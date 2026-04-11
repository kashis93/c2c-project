const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/alumni/directory (public)
// Returns all alumni with filters and safe fields only
router.get('/directory', async (req, res) => {
  try {
    const { department, batch, search, page = 1, limit = 30 } = req.query;
    const query = { role: 'alumni' }; // Filter by alumni role
    if (department && department !== 'All') query.department = department;
    if (batch && batch !== 'All') query.batch = batch;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('name profilePicture department batch title company isActive _id role bio currentJobTitle currentCompany currentLocation skills socialLinks')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Map User fields to Alumni fields for frontend compatibility
    const alumni = users.map(u => u.toPublicProfile());
    
    res.json({ success: true, alumni });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch directory', error: err.message });
  }
});

// GET /api/alumni/my-profile (protected)
router.get('/my-profile', protect, async (req, res) => {
  try {
    // The protect middleware already attaches the user object to req.user
    return res.status(200).json({ success: true, alumni: req.user.toPublicProfile() });
  } catch (err) {
    console.error('Get my profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/alumni/profile/:id (protected)
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }
    return res.status(200).json({ success: true, alumni: user.toPublicProfile() });
  } catch (err) {
    console.error('Get profile by ID error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/alumni/update-profile (protected)
router.put('/update-profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('💾 [UPDATE-PROFILE] Request for user:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ [UPDATE-PROFILE] User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const allowedFields = [
      'name', 'phone', 'bio', 'profilePhoto', 'currentJobTitle',
      'currentCompany', 'currentLocation', 'workExperience', 'skills', 'socialLinks',
      'department', 'batch', 'education'
    ];

    console.log('📝 [UPDATE-PROFILE] Updating fields:', Object.keys(req.body).filter(k => allowedFields.includes(k)));

    // Update allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    // After update check: if bio AND currentJobTitle AND currentCompany AND phone AND department AND batch are all filled → set isProfileComplete: true
    const requiredFields = {
      bio: !!user.bio,
      currentJobTitle: !!user.currentJobTitle,
      currentCompany: !!user.currentCompany,
      phone: !!user.phone,
      department: !!user.department,
      batch: !!user.batch
    };
    
    const isComplete = Object.values(requiredFields).every(v => v === true);
    user.isProfileComplete = isComplete;

    console.log('📊 [UPDATE-PROFILE] Profile completion check:', { requiredFields, isProfileComplete: isComplete });

    const updatedUser = await user.save();
    console.log('✅ [UPDATE-PROFILE] Profile saved successfully');

    return res.status(200).json({ 
      success: true, 
      alumni: updatedUser.toPublicProfile() 
    });
  } catch (err) {
    console.error('❌ [UPDATE-PROFILE] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
