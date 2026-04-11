"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.requireAuth, notificationController_1.getNotifications);
router.post('/mark-read', authMiddleware_1.requireAuth, notificationController_1.markAsRead);
exports.default = router;
//# sourceMappingURL=notifications.js.map