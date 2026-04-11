"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch unread or recent 20
        const notifications = await Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);
        // Count unread
        const unreadCount = await Notification_1.default.countDocuments({ userId, isRead: false });
        res.json({
            notifications,
            unreadCount
        });
    }
    catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body; // Array of IDs
        if (!Array.isArray(notificationIds)) {
            // Mark all as read if no specific IDs provided? Or just error.
            // Let's assume mark all as read if empty, or single.
            // Implementation: Mark specific ones.
            return res.status(400).json({ message: 'Invalid payload' });
        }
        await Notification_1.default.updateMany({ _id: { $in: notificationIds }, userId }, { $set: { isRead: true } });
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAsRead = markAsRead;
//# sourceMappingURL=notificationController.js.map