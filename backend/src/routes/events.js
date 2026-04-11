"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Event_1 = __importDefault(require("../models/Event"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const ensureDb = (res) => {
    if (mongoose_1.default.connection.readyState !== 1) {
        console.warn('⚠️ [DATABASE] Request received but database is not connected.');
        return true;
    }
    return true;
};
// Public list with pagination
router.get('/', async (req, res) => {
    if (!ensureDb(res))
        return;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    try {
        const events = await Event_1.default.find()
            .sort({ date: 1 })
            .skip(skip)
            .limit(limit)
            .populate('organizerId');
        
        const total = await Event_1.default.countDocuments();
        
        res.json({
            data: events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
    if (!ensureDb(res))
        return;
    
    try {
        const event = await Event_1.default.findById(req.params.id)
            .populate('organizerId');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Failed to fetch event' });
    }
});

// Alumni/admin can create events
router.post('/', authMiddleware_1.requireAuth, async (req, res) => {
    if (!ensureDb(res))
        return;
    
    const { 
        title, 
        date,
        startDate,
        description,
        headline,
        location,
        meetingLink,
        mode,
        tags,
        organizer,
        organizerEmail,
        maxAttendees,
        coverImage,
        registrationLink,
        contactInfo
    } = req.body;
    
    // Validate required fields
    if (!title) {
        return res.status(400).json({ message: 'title is required' });
    }
    
    if (!date && !startDate) {
        return res.status(400).json({ message: 'date or startDate is required' });
    }
    
    try {
        // Parse the date properly - accept either 'date' or 'startDate' field
        let eventDate = date || startDate;
        if (typeof eventDate === 'string') {
            eventDate = new Date(eventDate);
        }
        
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        
        // Create event
        const created = await Event_1.default.create({
            organizerId: req.user._id,
            title: title.trim(),
            date: eventDate,
            description: description || headline || '',
            location: location || '',
            type: mode === 'online' ? 'webinar' : (mode === 'offline' ? 'seminar' : 'webinar'),
            maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
            coverImage: coverImage || null,
            meetingLink: meetingLink || null,
            mode: mode || 'offline'
        });
        
        // Populate and return
        const populated = await Event_1.default.findById(created._id).populate('organizerId');
        return res.status(201).json(populated || created);
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ message: 'Failed to create event', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map