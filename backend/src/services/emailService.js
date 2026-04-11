/**
 * Email Service - Sends emails and manages temporary passwords
 * Uses NodeMailer with Gmail or any SMTP provider
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : '',
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Generate a temporary password
 */
function generateTemporaryPassword() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char password
}

/**
 * Send welcome email with temporary password to new alumni
 */
async function sendWelcomeEmailWithPassword(email, name, temporaryPassword) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] SMTP not configured, skipping email');
      return { success: true, skipped: true };
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🎓 Welcome to AluVerse - Your Alumni Network',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to AluVerse, ${name}! 👋</h2>
          
          <p>Your alumni account has been created successfully!</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your Temporary Password:</strong></p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e40af;">
              ${temporaryPassword}
            </p>
          </div>

          <h3>Next Steps:</h3>
          <ol>
            <li>Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'AluVerse'}</a></li>
            <li>Click "Sign Up"</li>
            <li>Use your email: <strong>${email}</strong></li>
            <li>Use this temporary password to create your account</li>
            <li>After signup, you can set your own password</li>
          </ol>

          <p style="color: #666; font-size: 14px;">
            <strong>Security Note:</strong> This temporary password will expire in 24 hours. 
            If you don't sign up within 24 hours, request a new password via "Forgot Password" on the login page.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't create this account, please ignore this email or contact support.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email without temporary password (CSV import flow)
 */
async function sendWelcomeEmailNoPassword(email, name) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] SMTP not configured, skipping email');
      return { success: true, skipped: true };
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🎓 Welcome to AluVerse - Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to AluVerse, ${name || 'Alumni'}! 👋</h2>
          
          <p>Your alumni account has been created successfully.</p>
          <p>When you visit the portal and start the signup process with your email, you will receive a temporary password to set up your account.</p>

          <ol>
            <li>Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'AluVerse'}</a></li>
            <li>Click "Sign Up" and enter your registered email</li>
            <li>Check your email for a temporary password</li>
            <li>Use it to set your permanent password</li>
          </ol>

          <p style="color: #666; font-size: 14px;">
            If you don't get an email, use "Forgot Password" on the login page to request one again.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Welcome (no password) sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send welcome (no password) email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email with temporary password
 */
async function sendPasswordResetEmail(email, name, temporaryPassword) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] SMTP not configured, skipping email');
      return { success: true, skipped: true };
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🔐 Reset Your AluVerse Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Password Reset Request 🔐</h2>
          
          <p>Hi ${name},</p>
          <p>We received a request to reset your AluVerse password.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your Temporary Password:</strong></p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e40af;">
              ${temporaryPassword}
            </p>
          </div>

          <h3>How to Reset:</h3>
          <ol>
            <li>Go to <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'AluVerse'}</a></li>
            <li>Click "Login"</li>
            <li>Click "Forgot Password?"</li>
            <li>Enter your email: <strong>${email}</strong></li>
            <li>Use the temporary password above to reset your account</li>
            <li>Set a new password of your choice</li>
          </ol>

          <p style="color: #d97706; font-size: 14px;">
            <strong>⏰ Expires In 24 Hours:</strong> This temporary password is valid for 24 hours only.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't request this reset, you can safely ignore this email. Your account is secure.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate and save temporary password for user
 */
async function generateAndStoreTemporaryPassword(userId) {
  try {
    const tempPassword = generateTemporaryPassword();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.findByIdAndUpdate(
      userId,
      {
        temporaryPassword: tempPassword,
        temporaryPasswordExpires: expiresAt,
      },
      { new: true }
    );

    return { tempPassword, expiresAt };
  } catch (error) {
    console.error('[EMAIL] Failed to generate temporary password:', error);
    throw error;
  }
}

/**
 * Verify and clear temporary password
 */
async function verifyTemporaryPassword(email, tempPassword) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { valid: false, message: 'User not found' };
    }

    if (!user.temporaryPassword) {
      return { valid: false, message: 'No temporary password set' };
    }

    if (new Date() > user.temporaryPasswordExpires) {
      return { valid: false, message: 'Temporary password expired' };
    }

    if (user.temporaryPassword !== tempPassword) {
      return { valid: false, message: 'Invalid temporary password' };
    }

    // Clear temporary password
    user.temporaryPassword = null;
    user.temporaryPasswordExpires = null;
    await user.save();

    return { valid: true, user };
  } catch (error) {
    console.error('[EMAIL] Failed to verify temporary password:', error);
    return { valid: false, message: error.message };
  }
}

/**
 * Send confirmation email after permanent password is set
 */
async function sendPasswordSetConfirmation(email, name, password) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] SMTP not configured, skipping email');
      return { success: true, skipped: true };
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '✅ Your AluVerse Password Has Been Set',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Password Set Successfully! ✅</h2>
          
          <p>Hi ${name},</p>
          <p>You have successfully set your permanent password for AluVerse.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your Account Details:</strong></p>
            <p><strong>Login Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>

          <p>You can now log in and complete your profile to connect with other alumni.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
               Log In to AluVerse
            </a>
          </p>

          <p style="color: #666; font-size: 14px;">
            <strong>Security Tip:</strong> Keep your login credentials safe. If you ever forget your password, you can use the "Forgot Password" feature.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't perform this action, please contact our support team immediately.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Password set confirmation sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send password set confirmation:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeEmailWithPassword,
  sendPasswordResetEmail,
  sendPasswordSetConfirmation,
  generateAndStoreTemporaryPassword,
  verifyTemporaryPassword,
  generateTemporaryPassword,
  sendWelcomeEmailNoPassword,
};
