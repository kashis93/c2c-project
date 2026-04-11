/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret123';

/**
 * Extract JWT token from Authorization header
 */
const getBearerToken = (req) => {
  const auth = req.header('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
};

/**
 * Verify JWT token and attach user to req
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ [DATABASE] Auth check requested but database is not connected.');
      // Allow auth to proceed - it will fail naturally at User.findById if DB is down
    }

    // Get user from database
    const user = await User.findById(decoded.userId); // Fetch full user object

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is not active' });
    }

    // Attach full user object to request
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Require user profile to be complete
 */
const requireProfileCompleted = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ [DATABASE] Profile completion check requested but database is not connected.');
      return next(); // Allow request to proceed
    }

    const user = await User.findById(req.user.id).select('isProfileComplete');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isProfileComplete) {
      return res.status(403).json({
        message: 'Profile setup required',
        code: 'PROFILE_INCOMPLETE',
      });
    }

    next();
  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. ${roles.join(' or ')} role required.`,
        });
      }

      // Additional check for admin role
      if (req.user.role === 'admin') {
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        if (adminEmail && req.user.email.toLowerCase() !== adminEmail) {
          return res.status(403).json({
            message: 'Access denied. Admin email not allowed.',
          });
        }
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if valid token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Invalid token, just continue without user
      return next();
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('_id email name role isActive');
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  requireAuth,
  requireProfileCompleted,
  requireRole,
  optionalAuth,
  getBearerToken,
  JWT_SECRET,
};
