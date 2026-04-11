"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Startup_1 = __importDefault(require("../models/Startup"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const ensureDb = (res) => {
    if (mongoose_1.default.connection.readyState !== 1) {
        console.warn('⚠️ [DATABASE] Request received but database is not connected.');
        return true;
    }
    return true;
};
// Public list
router.get('/', async (_req, res) => {
    if (!ensureDb(res))
        return;
    const startups = await Startup_1.default.find().sort({ createdAt: -1 }).populate('ownerId');
    res.json(startups);
});
// Students can create startups (UI: students create startups)
router.post('/', authMiddleware_1.requireAuth, authMiddleware_1.requireProfileCompleted, (0, authMiddleware_1.requireRole)(['student', 'admin']), async (req, res) => {
    if (!ensureDb(res))
        return;
    const { title, tagline } = req.body;
    if (!title)
        return res.status(400).json({ message: 'title is required' });
    const created = await Startup_1.default.create({
        ownerId: req.user.id,
        title,
        ...(tagline ? { tagline } : {}),
    });
    const populated = await Startup_1.default.findById(created._id).populate('ownerId');
    return res.status(201).json(populated || created);
});
exports.default = router;
//# sourceMappingURL=startups.js.map