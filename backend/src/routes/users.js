"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * User Routes
 * /api/users/*
 */
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware-new");
const userService_1 = require("../services/userService");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
/**
 * GET /api/users
 * Get all visible user profiles (requires auth and complete profile)
 */
router.get('/', authMiddleware_1.requireAuth, authMiddleware_1.requireProfileCompleted, async (_req, res) => {
    try {
        const users = await userService_1.UserService.getAllVisibleUsers();
        res.json(users);
    }
    catch (error) {
        (0, utils_1.logError)('[USERS] getAll', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({ message: constants_1.ERROR_MESSAGES.FAILED_TO_FETCH });
    }
});
/**
 * GET /api/users/:userId
 * Get specific user profile (public if visible)
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userService_1.UserService.getUserById(userId);
        res.json(user);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_FETCH;
        const statusCode = message.includes('Invalid') ? constants_1.HTTP_STATUS.BAD_REQUEST : constants_1.HTTP_STATUS.NOT_FOUND;
        res.status(statusCode).json({ message });
    }
});
/**
 * GET /api/users/me
 * Get current user profile (auth required)
 */
router.get('/me', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userService_1.UserService.getUserProfile(userId);
        res.json({ user });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_FETCH;
        (0, utils_1.logError)('[USERS] getMe', error);
        res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({ message });
    }
});
/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const user = await userService_1.UserService.updateProfile(userId, role, req.body);
        res.json({ user });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_UPDATE;
        (0, utils_1.logError)('[USERS] updateProfile', error);
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({ message });
    }
});
/**
 * PATCH /api/users/:userId/visibility
 * Toggle profile visibility
 */
router.patch('/:userId/visibility', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const currentUserId = req.user.id;
        // Only user or admin can change visibility
        if (userId !== currentUserId && req.user.role !== 'admin') {
            return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({ message: constants_1.ERROR_MESSAGES.ACCESS_DENIED });
        }
        const { visible } = req.body;
        const visibleValue = visible === true;
        const user = await userService_1.UserService.toggleProfileVisibility(userId, visibleValue);
        res.json({ user });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_UPDATE;
        const statusCode = message.includes('Invalid') ? constants_1.HTTP_STATUS.BAD_REQUEST : constants_1.HTTP_STATUS.NOT_FOUND;
        res.status(statusCode).json({ message });
    }
});
/**
 * GET /api/users/search/:query
 * Search users
 */
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const users = await userService_1.UserService.searchUsers(query);
        res.json(users);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_FETCH;
        res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({ message });
    }
});
/**
 * POST /api/users
 * Create user (admin only)
 */
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!email || !role) {
            return res
                .status(constants_1.HTTP_STATUS.BAD_REQUEST)
                .json({ message: 'Email and role are required' });
        }
        const user = await userService_1.UserService.createUser(name || 'User', email, role);
        res.status(constants_1.HTTP_STATUS.CREATED).json(user);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.FAILED_TO_CREATE;
        (0, utils_1.logError)('[USERS] create', error);
        const statusCode = message.includes('exists') ? constants_1.HTTP_STATUS.CONFLICT : constants_1.HTTP_STATUS.BAD_REQUEST;
        res.status(statusCode).json({ message });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map