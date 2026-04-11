const express = require('express');
const Internship = require('../models/Internship').default;
const { requireAuth } = require('../middleware/authMiddleware-new');
const router = express.Router();

// GET /api/opportunities
// Returns all internships/jobs with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const opportunities = await Internship.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Internship.countDocuments();
    
    res.json({
      data: opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch opportunities', error: err.message });
  }
});

// POST /api/opportunities
// Create a new opportunity
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      company, 
      location, 
      salary,
      stipend,
      opportunityType, 
      description, 
      skills,
      type,
      workMode,
      salaryRange,
      department,
      domain,
      deadline,
      applicationLink,
      experienceLevel,
      companyType,
      education,
      industry,
      roleCategory
    } = req.body;
    
    const skillsArray = Array.isArray(skills) 
      ? skills 
      : (skills ? skills.split(',').map(s => s.trim()) : []);
    
    const newOpp = new Internship({
      title: title || '',
      company: company || '',
      location: location || '',
      stipend: salary || stipend || '',
      type: opportunityType || type || 'Job',
      description: description || '',
      skills: skillsArray,
      postedById: req.user.id,
      workMode: workMode || 'Remote',
      salaryRange: salaryRange || 'Entry',
      department: department || 'CSE',
      domain: domain || 'software',
      deadline: deadline ? new Date(deadline) : null,
      applicationLink: applicationLink || '',
      experienceLevel: experienceLevel || 'Entry Level',
      companyType: companyType || '',
      education: education || '',
      industry: industry || '',
      roleCategory: roleCategory || ''
    });

    await newOpp.save();
    res.status(201).json(newOpp);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create opportunity', error: err.message });
  }
});

module.exports = router;
