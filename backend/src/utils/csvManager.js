/**
 * CSV User Management Utility
 * Imports alumni from CSV and validates registrations
 */

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { sendWelcomeEmailNoPassword } = require('../services/emailService');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/**
 * Parse CSV manually (handles BOM and quotes)
 */
function parseCSVLine(line) {
  // Remove BOM if present
  const cleanLine = line.replace(/^\uFEFF/, '').trim();
  // Simple CSV parser - handles basic comma separation
  return cleanLine.split(',').map(field => field.trim().replace(/^["']|["']$/g, ''));
}

/**
 * Load alumni from CSV file
 * Returns array of alumni objects
 */
async function loadAlumniFromCSV() {
  try {
    const csvPath = path.join(__dirname, '../../data/alumni.csv');
    const alumni = [];

    if (!fs.existsSync(csvPath)) {
      console.log('[CSV] alumni.csv not found');
      return [];
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
      console.log('[CSV] No data in alumni.csv');
      return [];
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const deptIdx = headers.indexOf('department');
    const batchIdx = headers.indexOf('batch');

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length > emailIdx && fields[emailIdx]) {
        const email = (fields[emailIdx] || '').toLowerCase();
        if (!emailRegex.test(email)) {
          continue;
        }
        alumni.push({
          name: fields[nameIdx] || '',
          email,
          department: fields[deptIdx] || '',
          batch: fields[batchIdx] || ''
        });
      }
    }

    console.log(`[CSV] Loaded ${alumni.length} alumni from CSV`);
    return alumni;
  } catch (error) {
    console.error('[CSV] Error loading alumni:', error);
    return [];
  }
}

/**
 * Initialize alumni from all CSV files in the data directory
 */
async function initializeAlumniFromCSV() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      console.log('[CSV] Data directory not found');
      return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    
    if (files.length === 0) {
      console.log('[CSV] No CSV files found to import');
      return;
    }

    for (const file of files) {
      const csvPath = path.join(dataDir, file);
      console.log(`[CSV] Processing file: ${file}`);
      
      const alumni = await loadAlumniFromFile(csvPath);
      
      for (const alumnus of alumni) {
         const existingUser = await User.findOne({ email: alumnus.email });
        if (!existingUser) {
          const newUser = new User({
            email: alumnus.email,
            name: alumnus.name,
            department: alumnus.department,
            batch: alumnus.batch,
            role: 'alumni',
            isActive: true,
            isProfileComplete: false,
            passwordHash: null,
          });
          await newUser.save();
          console.log(`[CSV] ✓ Imported: ${alumnus.email}`);
          sendWelcomeEmailNoPassword(alumnus.email, alumnus.name).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error('[CSV] Error initializing alumni:', error);
  }
}

/**
 * Load alumni from a specific file
 */
async function loadAlumniFromFile(csvPath) {
  try {
    const alumni = [];
    if (!fs.existsSync(csvPath)) return [];

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const deptIdx = headers.indexOf('department');
    const batchIdx = headers.indexOf('batch');

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length > emailIdx && fields[emailIdx]) {
        const email = (fields[emailIdx] || '').toLowerCase();
        if (!emailRegex.test(email)) {
          continue;
        }
        alumni.push({
          name: fields[nameIdx] || '',
          email,
          department: fields[deptIdx] || '',
          batch: fields[batchIdx] || ''
        });
      }
    }
    return alumni;
  } catch (error) {
    console.error(`[CSV] Error loading ${csvPath}:`, error);
    return [];
  }
}

/**
 * Watch data directory for new or changed CSV files
 */
function watchCSVForChanges() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`[CSV] Watching folder ${dataDir} for CSV changes`);
    
    fs.watch(dataDir, (eventType, filename) => {
      if (filename && filename.endsWith('.csv')) {
        console.log(`[CSV] File ${filename} ${eventType}. Re-scanning...`);
        // Debounce import
        if (global.csvImportTimeout) clearTimeout(global.csvImportTimeout);
        global.csvImportTimeout = setTimeout(() => {
          initializeAlumniFromCSV();
        }, 2000);
      }
    });
  } catch (error) {
    console.error('[CSV] Failed to start folder watcher:', error);
  }
}

/**
 * Check if user is pre-registered (exists in DB without password OR exists in any CSV)
 */
async function isPreRegisteredAlumni(email) {
  try {
    const target = (email || '').toLowerCase().trim();
    if (!target || !emailRegex.test(target)) return false;

    // 1. DB check (most reliable)
    const dbUser = await User.findOne({ email: target });
    // User exists but has no password yet (means imported from CSV or Admin)
    if (dbUser && !dbUser.passwordHash) {
      return true;
    }

    // 2. CSV scan (for users not yet imported or if DB import failed)
    const dataDir = path.join(__dirname, '../../data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
      for (const f of files) {
        const list = await loadAlumniFromFile(path.join(dataDir, f));
        if (list.some(a => a.email === target)) return true;
      }
    }

    return false;
  } catch (e) {
    console.error('[CSV] isPreRegisteredAlumni error:', e);
    return false;
  }
}

/**
 * Back-compat: Check if user is in DB as CSV-imported (no password set)
 */
async function isAlumniInCSV(email) {
  try {
    const target = (email || '').toLowerCase().trim();
    if (!target || !emailRegex.test(target)) return false;
    const dbUser = await User.findOne({ email: target });
    return !!(dbUser && !dbUser.passwordHash);
  } catch (e) {
    console.error('[CSV] isAlumniInCSV error:', e);
    return false;
  }
}

/**
 * Back-compat: Check if email exists in any CSV or DB pre-registration
 */
async function isEmailInCSV(email) {
  return isPreRegisteredAlumni(email);
}

module.exports = {
  loadAlumniFromCSV,
  initializeAlumniFromCSV,
  isAlumniInCSV,
  isEmailInCSV,
  isPreRegisteredAlumni,
  watchCSVForChanges,
};
