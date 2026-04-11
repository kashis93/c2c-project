/**
 * Authentication Middleware - Compatibility Layer
 * Re-exports from authMiddleware-new.js for backward compatibility
 */

const {
  requireAuth,
  requireProfileCompleted,
  requireRole,
  optionalAuth,
  getBearerToken,
  JWT_SECRET,
} = require('./authMiddleware-new');

// Export as both requireAuth and protect for compatibility with different import styles
module.exports = {
  requireAuth,
  protect: requireAuth, // Alias for protect middleware used in new alumni routes
  requireProfileCompleted,
  requireRole,
  optionalAuth,
  getBearerToken,
  JWT_SECRET,
};
