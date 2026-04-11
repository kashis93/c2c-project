"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
class ActivityService {
    /**
     * Log an activity (question asked, answer posted, blog created, etc.)
     */
    static async logActivity(data) {
        try {
            const activity = await Activity_1.default.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                description: data.description,
                relatedId: data.relatedId,
                relatedType: data.relatedType,
                visibility: data.visibility || 'public',
            });
            return activity.populate('userId', 'name email profileImage role');
        }
        catch (error) {
            console.error('Error logging activity:', error);
            throw error;
        }
    }
    /**
     * Get activities for a user (personalized feed)
     */
    static async getUserActivities(userId, limit = 20) {
        try {
            return await Activity_1.default.find({ userId })
                .populate('userId', 'name email profileImage role')
                .sort({ createdAt: -1 })
                .limit(limit);
        }
        catch (error) {
            console.error('Error fetching user activities:', error);
            throw error;
        }
    }
    /**
     * Get activity feed for alumni (see what students are doing + alumni activity)
     */
    static async getAlumniActivityFeed(limit = 50) {
        try {
            return await Activity_1.default.find({
                $or: [
                    { visibility: 'public' },
                    { visibility: 'alumni' },
                    { type: { $in: ['question_asked', 'answer_posted', 'blog_created', 'user_signup'] } }
                ]
            })
                .populate('userId', 'name email profileImage role')
                .sort({ createdAt: -1 })
                .limit(limit);
        }
        catch (error) {
            console.error('Error fetching alumni feed:', error);
            throw error;
        }
    }
    /**
     * Get activity feed for students (see what other students and alumni are doing)
     */
    static async getStudentActivityFeed(limit = 50) {
        try {
            return await Activity_1.default.find({
                $or: [
                    { visibility: 'public' },
                    { visibility: 'students' },
                    { type: { $in: ['blog_created', 'event_created', 'challenge_created'] } }
                ]
            })
                .populate('userId', 'name email profileImage role')
                .sort({ createdAt: -1 })
                .limit(limit);
        }
        catch (error) {
            console.error('Error fetching student feed:', error);
            throw error;
        }
    }
    /**
     * Get latest questions/answers (real-time updates)
     */
    static async getLatestQAndA(limit = 20) {
        try {
            return await Activity_1.default.find({
                type: { $in: ['question_asked', 'answer_posted'] },
                visibility: { $in: ['public', 'alumni'] }
            })
                .populate('userId', 'name email profileImage role')
                .sort({ createdAt: -1 })
                .limit(limit);
        }
        catch (error) {
            console.error('Error fetching Q&A:', error);
            throw error;
        }
    }
    /**
     * Mark activity as read by a user
     */
    static async markActivityAsRead(activityId, userId) {
        try {
            return await Activity_1.default.findByIdAndUpdate(activityId, { $addToSet: { readBy: userId } }, { new: true }).populate('userId', 'name email profileImage role');
        }
        catch (error) {
            console.error('Error marking activity as read:', error);
            throw error;
        }
    }
    /**
     * Get unread activities count for a user
     */
    static async getUnreadCount(userId) {
        try {
            return await Activity_1.default.countDocuments({
                $or: [
                    { visibility: 'public' },
                    { visibility: 'alumni' },
                ],
                readBy: { $nin: [userId] }
            });
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
}
exports.ActivityService = ActivityService;
//# sourceMappingURL=activityService.js.map