"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterVisibleUsers = exports.sanitizePublicUser = exports.sanitizeUser = void 0;
/**
 * Remove sensitive fields from user object for API responses
 */
const sanitizeUser = (user) => {
    if (!user)
        return user;
    if (typeof user.toObject === 'function') {
        const obj = user.toObject();
        delete obj.passwordHash;
        delete obj.authToken;
        return obj;
    }
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.authToken;
    return copy;
};
exports.sanitizeUser = sanitizeUser;
/**
 * Remove sensitive fields for public profile display
 */
const sanitizePublicUser = (user) => {
    const sanitized = (0, exports.sanitizeUser)(user);
    // Add additional filtering for public display if needed
    return sanitized;
};
exports.sanitizePublicUser = sanitizePublicUser;
/**
 * Filter visible users only
 */
const filterVisibleUsers = (users) => {
    return users
        .filter(u => u.profileCompleted && u.profileVisible)
        .map(u => (0, exports.sanitizePublicUser)(u));
};
exports.filterVisibleUsers = filterVisibleUsers;
//# sourceMappingURL=sanitizer.js.map