const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const User = require('../models/User');
const { sendWelcomeEmailNoPassword } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/import-csv', upload.single('file'), async (req, res) => {
  const results = [];
  const created = [];
  const skipped = [];
  const failed = [];
  const filePath = req.file.path;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      for (const row of results) {
        try {
          const emailLower = row.email.toLowerCase();
          if (!emailRegex.test(emailLower)) {
            failed.push(row.email);
            continue;
          }
          const exists = await User.findOne({ email: emailLower });
          if (exists) {
            skipped.push(row.email);
            continue;
          }
          const user = new User({
            name: row.name,
            email: emailLower,
            department: row.department,
            batch: row.batch,
            passwordHash: null,
            temporaryPassword: null,
            temporaryPasswordExpires: null,
            isActive: true,
            isProfileComplete: false,
            role: 'alumni',
          });
          
          await user.save();
          await sendWelcomeEmailNoPassword(row.email, row.name);
          created.push(row.email);
        } catch (err) {
          console.error(`Error importing ${row.email}:`, err);
          failed.push(row.email);
        }
      }
      fs.unlinkSync(filePath);
      res.json({ created, skipped, failed });
    });
});

module.exports = router;
