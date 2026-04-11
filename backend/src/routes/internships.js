"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Internship_1 = __importDefault(require("../models/Internship"));
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
    const internships = await Internship_1.default.find().sort({ createdAt: -1 }).populate('postedById');
    res.json(internships);
});
// Alumni/admin can post internships
router.post('/', authMiddleware_1.requireAuth, authMiddleware_1.requireProfileCompleted, (0, authMiddleware_1.requireRole)(['alumni', 'admin']), async (req, res) => {
    if (!ensureDb(res))
        return;
    const { title, company, description } = req.body;
    if (!title)
        return res.status(400).json({ message: 'title is required' });
    const created = await Internship_1.default.create({
        postedById: req.user.id,
        title,
        ...(company ? { company } : {}),
        ...(description ? { description } : {}),
    });
    // TRIGGER NOTIFICATION
    Promise.resolve().then(() => __importStar(require('../services/notificationService'))).then(service => {
        service.createInternshipNotification(created).catch(err => console.error('Notification trigger failed', err));
    });
    const populated = await Internship_1.default.findById(created._id).populate('postedById');
    return res.status(201).json(populated || created);
});
// Students apply (UI: students participate)
router.post('/:id/apply', authMiddleware_1.requireAuth, authMiddleware_1.requireProfileCompleted, (0, authMiddleware_1.requireRole)(['student']), async (req, res) => {
    if (!ensureDb(res))
        return;
    const internship = await Internship_1.default.findById(req.params.id);
    if (!internship)
        return res.status(404).json({ message: 'Internship not found' });
    const userId = req.user.id;
    const already = internship.applicants?.some((a) => a.toString() === userId);
    if (already)
        return res.status(409).json({ message: 'Already applied' });
    await Internship_1.default.updateOne({ _id: internship._id }, { $addToSet: { applicants: userId } });
    return res.status(201).json({ success: true });
});
exports.default = router;
//# sourceMappingURL=internships.js.map