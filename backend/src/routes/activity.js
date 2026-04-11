"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const activityService_1 = require("../services/activityService");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
/**
 * GET /api/activity/feed
 * Get personalized activity feed based on user role
 */
router.get('/feed', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = req.user;
        const limit = parseInt(req.query.limit) || 50;
        let activities;
        if (user.role === 'alumni') {
            activities = await activityService_1.ActivityService.getAlumniActivityFeed(limit);
        }
        else {
            activities = await activityService_1.ActivityService.getStudentActivityFeed(limit);
        }
        res.json({ activities });
    }
    catch (error) {
        (0, utils_1.logError)('[ACTIVITY] feed', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({
            message: constants_1.ERROR_MESSAGES.FAILED_TO_FETCH
        });
    }
});
/**
 * GET /api/activity/user/:userId
 * Get activities by a specific user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const activities = await activityService_1.ActivityService.getUserActivities(userId, limit);
        res.json({ activities });
    }
    catch (error) {
        (0, utils_1.logError)('[ACTIVITY] user', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({
            message: constants_1.ERROR_MESSAGES.FAILED_TO_FETCH
        });
    }
});
/**
 * GET /api/activity/qa
 * Get latest Q&A activities (for real-time updates)
 */
router.get('/qa', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const activities = await activityService_1.ActivityService.getLatestQAndA(limit);
        res.json({ activities });
    }
    catch (error) {
        (0, utils_1.logError)('[ACTIVITY] qa', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({
            message: constants_1.ERROR_MESSAGES.FAILED_TO_FETCH
        });
    }
});
/**
 * PUT /api/activity/:activityId/read
 * Mark activity as read
 */
router.put('/:activityId/read', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.userId;
        const activity = await activityService_1.ActivityService.markActivityAsRead(activityId, userId);
        res.json({ activity });
    }
    catch (error) {
        (0, utils_1.logError)('[ACTIVITY] mark-read', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({
            message: constants_1.ERROR_MESSAGES.FAILED_TO_UPDATE
        });
    }
});
/**
 * GET /api/activity/unread/count
 * Get unread activities count
 */
router.get('/unread/count', authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const count = await activityService_1.ActivityService.getUnreadCount(userId);
        res.json({ count });
    }
    catch (error) {
        (0, utils_1.logError)('[ACTIVITY] unread-count', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_ERROR).json({
            message: constants_1.ERROR_MESSAGES.FAILED_TO_FETCH
        });
    }
});
exports.default = router;
//# sourceMappingURL=activity.js.map