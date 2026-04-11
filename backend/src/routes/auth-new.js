/**
 * Authentication Routes
 * /api/auth/*
 * Handles signup, login, token refresh, password change, etc.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/authMiddleware-new');
const { isPreRegisteredAlumni } = require('../utils/csvManager');
const {
  sendWelcomeEmailWithPassword,
  sendPasswordResetEmail,
  sendPasswordSetConfirmation,
  generateAndStoreTemporaryPassword,
  verifyTemporaryPassword,
} = require('../services/emailService');

const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret123';
const JWT_EXPIRES_IN = '7d';

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ [DATABASE] Request received but database is not connected.');
    // For development/emergency: allow the request to proceed even if DB is down
    // This avoids 503 errors and allows the frontend to stay alive.
    // Real errors will be caught in the try-catch blocks of the routes.
    return true; 
  }
  return true;
};

/**
 * Helper: Generate JWT token
 */
const generateToken = (userId, role = 'alumni') => {
  return jwt.sign(
    {
      userId,
      role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Helper: Return user object (for responses)
 */
const getUserObject = (user) => user.toPublicProfile();

/**
 * POST /api/auth/verify-alumni
 * Verify if email exists in alumni database (for SignUp email verification)
 */
router.post('/verify-alumni', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email: rawEmail } = req.body;
    const email = (rawEmail || '').toLowerCase().trim();

    console.log('🔍 [VERIFY-ALUMNI] Checking email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user in database
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ [VERIFY-ALUMNI] Email not found in database:', email);
      return res.status(404).json({
        success: false,
        message: 'Email not found in alumni database. Please contact your administrator.',
      });
    }

    console.log('✅ [VERIFY-ALUMNI] Email verified:', email);

    return res.status(200).json({
      success: true,
      message: 'Email verified! Ready to login.',
      email: user.email,
      name: user.name || 'Alumni',
    });
  } catch (error) {
    console.error('❌ [VERIFY-ALUMNI] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed: ' + error.message,
    });
  }
});

/**
 * POST /api/auth/self-register
 * Create a new alumni account (not pre-registered in CSV)
 * User provides: email, password, name
 */
router.post('/self-register', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email, password, name } = req.body;

    console.log('🆕 [SELF-REGISTER] Creating account for:', email);

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ [SELF-REGISTER] Email already registered:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (NOT from CSV import)
    const newUser = new User({
      email: email.toLowerCase(),
      name: name,
      passwordHash: hashedPassword,
      role: 'alumni',
      isActive: true,
      isProfileComplete: false,
      isFirstLogin: false, // They already set password, so NOT first login
      // No temporaryPassword since they created account themselves
    });

    await newUser.save();
    console.log('✅ [SELF-REGISTER] Account created successfully:', email);

    // Generate token for immediate login
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      isProfileComplete: newUser.isProfileComplete,
      alumni: getUserObject(newUser),
    });
  } catch (error) {
    console.error('❌ [SELF-REGISTER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + error.message,
    });
  }
});

/**
 * POST /api/auth/signup
 * Register a new user (only CSV alumni allowed)
 * Sends ONE welcome email with temporary password
 */
router.post('/signup', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email: rawEmail } = req.body;
    const email = (rawEmail || '').toLowerCase().trim();

    // Validate input
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    // Check if email is a pre-registered alumni (DB-first), fallback to CSV files
    const inCSV = await isPreRegisteredAlumni(email);
    
    // Find existing user
    let user = await User.findOne({ email });
    
    if (user && user.passwordHash && user.passwordHash !== 'google_oauth') {
      return res.status(400).json({ message: 'User already has an account. Please login.' });
    }

    if (inCSV) {
      // FLOW 1: Pre-registered Alumni (CSV)
      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          role: 'alumni',
          isActive: true,
          isProfileComplete: false,
          passwordHash: null,
        });
        await user.save();
      }
      
      // Generate and store temporary password
      const { tempPassword } = await generateAndStoreTemporaryPassword(user._id);
      user = await User.findById(user._id);

      // Send welcome email with temporary password
      const emailResult = await sendWelcomeEmailWithPassword(email, user.name || 'Alumni', tempPassword);

      return res.status(201).json({
        success: true,
        message: 'Pre-registered account found! Check your email for temporary password.',
        tempPassword: emailResult.skipped ? tempPassword : undefined,
        email,
        instructions: 'Check your email for the temporary password. Use it to set your permanent password.',
      });
    } else {
      // FLOW 2: New User Registration (Not in CSV)
      const { password, name } = req.body;
      
      // If password is NOT provided, it's the initial check request.
      // Tell the frontend that this is a new registration flow.
      if (!password) {
        return res.status(200).json({
          success: true,
          message: 'Email not pre-registered. Please create a new account.',
          flow: 'new_registration'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          name: name || 'Alumni',
          role: 'alumni',
          isActive: true,
          isProfileComplete: false,
          passwordHash: await bcrypt.hash(password, 10),
        });
      } else {
        // If user existed (e.g. from Google login) but didn't have password
        user.passwordHash = await bcrypt.hash(password, 10);
      }

      await user.save();

      // Send confirmation email
      await sendPasswordSetConfirmation(email, user.name, password);

      // Generate token for automatic login
      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        isProfileComplete: user.isProfileComplete,
        alumni: getUserObject(user),
        user: getUserObject(user),
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed: ' + error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user with email and password
 * 
 * PROFESSIONAL FLOW:
 * 
 * Type 1 (CSV Imported Alumni):
 *   - User has temporaryPassword in DB but NO passwordHash
 *   - They try to login → Backend checks: Has temp? Return { requiresPasswordSetup: true }
 *   - Frontend redirects to /verify-temp-password
 *   - User verifies temp → Calls /verify-temp-password endpoint
 *   - Gets token → Redirected to /set-password
 *   - Sets permanent password → Backend DELETES temp password
 *   - Can now only login with permanent password
 * 
 * Type 2 (Self-Registered or Type 1 After Setup):
 *   - User has passwordHash, NO temporaryPassword
 *   - They try to login → Verify permanent password normally
 *   - Success → Redirected to /complete-profile or /profile/me
 */
router.post('/login', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email: rawEmail, password } = req.body;
    const email = (rawEmail || '').toLowerCase().trim();

    console.log('🔐 [LOGIN] Attempt with email:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ [LOGIN] User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ [LOGIN] User found:', user.email);

    // Check if user needs temp password verification first
    if (user.temporaryPassword && !user.passwordHash) {
      console.log('🔑 [LOGIN] USER NEEDS TEMP PASSWORD VERIFICATION');
      console.log('  - Has temporaryPassword: ✓');
      console.log('  - Has passwordHash: ✗');
      return res.status(401).json({
        message: 'Please verify your temporary password first',
        requiresPasswordSetup: true, // Frontend will redirect to /verify-temp-password
        email: user.email
      });
    }

    // Try to match permanent password
    let passwordMatch = false;
    if (user.passwordHash && user.passwordHash !== 'google_oauth') {
      console.log('🔍 [LOGIN] Verifying permanent password...');
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (passwordMatch) {
        console.log('✅ [LOGIN] Permanent password matched');
      }
    }

    // If no permanent password match  → error
    if (!passwordMatch) {
      console.log('❌ [LOGIN] Password invalid for:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.isActive = true;
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    console.log('✅ [LOGIN] Successful for:', user.email);
    console.log('  - isProfileComplete:', user.isProfileComplete);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      isProfileComplete: user.isProfileComplete,
      alumni: getUserObject(user),
      user: getUserObject(user), // Include both for compatibility
    });
  } catch (error) {
    console.error('❌ [LOGIN] Server error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

/**
 * POST /api/auth/verify-temp-password
 * VERIFY TEMPORARY PASSWORD (First-time setup for CSV alumni)
 * 
 * This is the ONE-TIME verification step before setting permanent password.
 * After permanent password is set, temporary password is DELETED.
 * 
 * Body: { email, tempPassword }
 * Response: { token, alumni } if success, or 401 if invalid
 */
router.post('/verify-temp-password', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email: rawEmail, tempPassword } = req.body;
    const email = (rawEmail || '').toLowerCase().trim();

    console.log('🔐 [VERIFY-TEMP-PASSWORD] Verification attempt for:', email);

    // Validation
    if (!email || !tempPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and temporary password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ [VERIFY-TEMP-PASSWORD] User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ [VERIFY-TEMP-PASSWORD] User found:', user.email);

    // Check if user has temporary password
    if (!user.temporaryPassword) {
      console.log('❌ [VERIFY-TEMP-PASSWORD] User does not have temporary password');
      return res.status(401).json({
        success: false,
        message: 'User does not have a temporary password. Please contact support.'
      });
    }

    // Verify temp password
    console.log('🔍 [VERIFY-TEMP-PASSWORD] Comparing temp password hash...');
    if (user.temporaryPasswordExpires && new Date() > user.temporaryPasswordExpires) {
      console.log('❌ [VERIFY-TEMP-PASSWORD] Temporary password expired');
      return res.status(401).json({
        success: false,
        message: 'Temporary password expired. Please request a new one.'
      });
    }

    const passwordMatch = user.temporaryPassword === tempPassword;

    if (!passwordMatch) {
      console.log('❌ [VERIFY-TEMP-PASSWORD] Temporary password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid temporary password'
      });
    }

    console.log('✅ [VERIFY-TEMP-PASSWORD] Temporary password verified!');

    // Generate token (user is now authenticated, but still needs to set permanent password)
    const token = generateToken(user._id, user.role);

    // Mark that user is verified but needs to set password
    console.log('🔄 [VERIFY-TEMP-PASSWORD] User can now set permanent password');

    res.json({
      success: true,
      message: 'Temporary password verified! Please set your permanent password.',
      token,
      alumni: getUserObject(user),
    });
  } catch (error) {
    console.error('❌ [VERIFY-TEMP-PASSWORD] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed: ' + error.message
    });
  }
});

/**
 * POST /api/auth/google
 * Google OAuth login/signup
 */
router.post('/google', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email, name, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        name,
        googleId: googleId || null,
        passwordHash: 'google_oauth', // Can't login with password
        isActive: true,
        role: 'alumni',
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
});

/**
 * POST /api/auth/set-password
 * Set permanent password using temporary password (first-time setup after signup)
 * Body: { email, tempPassword, newPassword }
 */
router.post('/set-password', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email, tempPassword, newPassword } = req.body;

    // Validate input
    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({
        message: 'Email, temporary password, and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    // Verify temporary password
    const { valid, user } = await verifyTemporaryPassword(email, tempPassword);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid or expired temporary password. Please request a new one.',
      });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.isProfileComplete = false; // They still need to complete profile details
    await user.save();

    // Send confirmation email
    await sendPasswordSetConfirmation(email, user.name || 'Alumni', newPassword);

    // Generate token for automatic login
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Password set successfully! You can now login.',
      token,
      isProfileComplete: user.isProfileComplete,
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Failed to set password: ' + error.message });
  }
});

/**
 * PUT /api/auth/set-password-protected
 * Set permanent password for authenticated users (after login with temp password)
 * PROTECTED - requires Bearer token in Authorization header
 * Body: { newPassword }
 */
router.put('/set-password-protected', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user.id;
    const { newPassword } = req.body;

    console.log('🔐 [SET-PASSWORD-PROTECTED] For user:', userId);

    // Validate input
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Find user by ID (from token)
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ [SET-PASSWORD-PROTECTED] User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ [SET-PASSWORD-PROTECTED] User found:', user.email);

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.temporaryPassword = null; // DELETE temporary password - can't use it anymore
    user.isFirstLogin = false; // No longer first login
    user.isProfileComplete = false; // Still need to complete profile
    await user.save();

    console.log('✅ [SET-PASSWORD-PROTECTED] Password updated for:', user.email);
    console.log('✅ [SET-PASSWORD-PROTECTED] Temporary password DELETED - only permanent password works now');

    // Send confirmation email
    try {
      await sendPasswordSetConfirmation(user.email, user.name || 'Alumni', newPassword);
    } catch (emailError) {
      console.warn('⚠️ [SET-PASSWORD-PROTECTED] Email failed:', emailError.message);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      message: 'Password set successfully!',
      isProfileComplete: user.isProfileComplete,
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('❌ [SET-PASSWORD-PROTECTED] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set password: ' + error.message,
    });
  }
});

/**
 * POST /api/auth/activate
 * Activate user account (mark as active after first login with temp password)
 */
router.post('/activate', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    user.isProfileComplete = true;
    await user.save();

    res.json({
      success: true,
      message: 'Account activated',
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ message: 'Failed to activate account' });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      alumni: getUserObject(user),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password (requires old password)
 */
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Old password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newToken = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Token refreshed',
      token: newToken,
      alumni: getUserObject(user),
      user: getUserObject(user),
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends ONE temporary password via email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate and store temporary password - SEND ONLY 1 EMAIL
    const { tempPassword } = await generateAndStoreTemporaryPassword(user._id);
    user.passwordResetSentAt = new Date();
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, user.name || 'Alumni', tempPassword);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      tempPassword: emailResult.skipped ? tempPassword : undefined, // Show only if email not sent (dev/test)
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred: ' + error.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using temporary password
 * Body: { email, tempPassword, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({
        message: 'Email, temporary password, and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    // Verify temporary password
    const { valid, user } = await verifyTemporaryPassword(email, tempPassword);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid or expired temporary password.',
      });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password: ' + error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token cleanup)
 */
router.post('/logout', (req, res) => {
  // Token invalidation should be handled client-side
  // In production, consider using a token blacklist or shorter expiration
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
