"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Challenge_1 = __importDefault(require("../models/Challenge"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const ensureDb = (res) => {
    if (mongoose_1.default.connection.readyState !== 1) {
        console.warn('⚠️ [DATABASE] Request received but database is not connected.');
        return true;
    }
    return true;
};
// Anyone can view challenges
router.get('/', async (req, _res) => {
    if (!ensureDb(_res))
        return;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    try {
        const challenges = await Challenge_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId');
        
        const total = await Challenge_1.default.countDocuments();
        
        _res.json({
            data: challenges,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        _res.status(500).json({ message: 'Failed to fetch challenges' });
    }
});

// Get single challenge by ID
router.get('/:id', async (req, res) => {
    if (!ensureDb(res))
        return;
    
    try {
        const challenge = await Challenge_1.default.findById(req.params.id)
            .populate('authorId');
        
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        
        res.json(challenge);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ message: 'Failed to fetch challenge' });
    }
});

// Alumni/admin create challenges
router.post('/', authMiddleware_1.requireAuth, async (req, res) => {
    if (!ensureDb(res))
        return;
    const { 
        title, 
        description, 
        companyName, 
        batchYear, 
        domain, 
        problemStatement, 
        skillsRequired, 
        expectedDeliverables,
        cashReward,
        internshipReward,
        certificateReward,
        mentorshipReward,
        otherRewards,
        deadline,
        registrationLink,
        contactEmail,
        difficulty,
        duration
    } = req.body;
    
    if (!title)
        return res.status(400).json({ message: 'title is required' });
    if (!description)
        return res.status(400).json({ message: 'description is required' });
    
    try {
        const created = await Challenge_1.default.create({
            authorId: req.user._id ? req.user._id.toString() : req.user.id,
            title,
            description,
            companyName: companyName || '',
            batchYear: batchYear || '',
            domain: domain || '',
            problemStatement: problemStatement || '',
            skillsRequired: skillsRequired || '',
            expectedDeliverables: expectedDeliverables || '',
            cashReward: cashReward || '',
            internshipReward: internshipReward || false,
            certificateReward: certificateReward || false,
            mentorshipReward: mentorshipReward || false,
            otherRewards: otherRewards || '',
            deadline: deadline ? new Date(deadline) : null,
            registrationLink: registrationLink || '',
            contactEmail: contactEmail || '',
            difficulty: difficulty || 'beginner',
            duration: duration || '1week'
        });
        const populated = await Challenge_1.default.findById(created._id).populate('authorId');
        return res.status(201).json(populated || created);
    } catch (error) {
        console.error('Error creating challenge:', error);
        return res.status(500).json({ message: 'Failed to create challenge', error: error.message });
    }
});
// Students submit solutions
router.post('/:id/submissions', authMiddleware_1.requireAuth, authMiddleware_1.requireProfileCompleted, (0, authMiddleware_1.requireRole)(['student']), async (req, res) => {
    if (!ensureDb(res))
        return;
    const challenge = await Challenge_1.default.findById(req.params.id);
    if (!challenge)
        return res.status(404).json({ message: 'Challenge not found' });
    const { content } = req.body;
    if (!content)
        return res.status(400).json({ message: 'content is required' });
    const submissionId = new mongoose_1.default.Types.ObjectId().toString();
    await Challenge_1.default.updateOne({ _id: challenge._id }, {
        $push: {
            submissions: {
                id: submissionId,
                studentId: req.user._id ? req.user._id.toString() : req.user.id,
                content,
                createdAt: new Date(),
            },
        },
    });
    return res.status(201).json({ success: true, submissionId });
});
exports.default = router;
//# sourceMappingURL=challenges.js.map