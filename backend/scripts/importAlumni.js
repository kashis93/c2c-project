const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');
const { sendWelcomeEmailNoPassword } = require('../src/services/emailService');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// MongoDB connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('✗ Error: MONGO_URI not found in .env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('✓ MongoDB connected!'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Parse CLI arguments
const args = process.argv.slice(2);
const csvArg = args.find(a => !a.startsWith('-'));
const csvFilePath = csvArg
  ? path.resolve(process.cwd(), csvArg)
  : path.resolve(__dirname, '../data/alumni.csv');

if (!fs.existsSync(csvFilePath)) {
  console.error(`✗ Error: CSV file not found at ${csvFilePath}`);
  console.log('Usage: node scripts/importAlumni.js [path/to/alumni.csv]');
  process.exit(1);
}

const stats = {
  total: 0,
  created: 0,
  skipped: 0,
  emailsSent: 0,
  emailFailed: 0
};

console.log(`\n🚀 Starting Alumni Import from: ${csvFilePath}\n`);

const processRows = async () => {
  const rows = [];
  
  // Read all rows first to handle async processing properly
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.toLowerCase().trim()
      }))
      .on('data', (row) => {
        // Normalize column names (case-insensitive)
        const normalizedRow = {};
        for (const key in row) {
          if (key.includes('name')) normalizedRow.name = row[key];
          else if (key.includes('email')) normalizedRow.email = row[key];
          else if (key.includes('department')) normalizedRow.department = row[key];
          else if (key.includes('batch')) normalizedRow.batch = row[key];
          else normalizedRow[key] = row[key];
        }
        if (normalizedRow.email && normalizedRow.name) {
          rows.push(normalizedRow);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${rows.length} valid rows to process.\n`);

  for (const row of rows) {
    stats.total++;
    try {
      const emailLower = row.email.toLowerCase().trim();

      // Basic email format validation
      if (!emailRegex.test(emailLower)) {
        stats.skipped++;
        console.log(`- Skipped invalid email: ${row.email}`);
        continue;
      }

      // Check if email already exists in MongoDB
      let user = await User.findOne({ email: emailLower });
      if (user) {
        stats.skipped++;
        console.log(`- Skipped existing alumni: ${row.name} (${row.email})`);
        continue;
      }

      // Create User document WITHOUT password
      user = new User({
        name: row.name,
        email: emailLower,
        department: row.department,
        batch: row.batch,
        passwordHash: null,
        temporaryPassword: null,
        temporaryPasswordExpires: null,
        isActive: true,
        isProfileComplete: false,
        role: 'alumni'
      });
      await user.save();
      stats.created++;

      // Send welcome email (no password)
      try {
        await sendWelcomeEmailNoPassword(emailLower, user.name);
        stats.emailsSent++;
        console.log(`✓ Created and welcomed: ${row.name} (${row.email})`);
      } catch (emailErr) {
        stats.emailFailed++;
        console.error(`✗ Email failed for ${row.name} (${row.email}):`, emailErr.message);
      }

    } catch (err) {
      console.error(`✗ Error for ${row.email}:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Records:       ${stats.total}`);
  console.log(`Created:             ${stats.created}`);
  console.log(`Skipped (existed):   ${stats.skipped}`);
  console.log(`Emails Sent:         ${stats.emailsSent}`);
  console.log(`Email Failures:      ${stats.emailFailed}`);
  console.log('='.repeat(50) + '\n');

  // Close mongoose connection
  await mongoose.disconnect();
  console.log('✓ Database disconnected');
  process.exit(0);
};

// Run the script
processRows().catch(err => {
  console.error('Critical error:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
