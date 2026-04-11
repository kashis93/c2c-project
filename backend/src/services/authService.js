"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const password_1 = require("../utils/password");
const token_1 = require("../utils/token");
const sanitizer_1 = require("../utils/sanitizer");
const validators_1 = require("../utils/validators");
const constants_1 = require("../constants");
class AuthService {
    /**
     * Register a new user
     */
    static async signup(req) {
        const { name, email: rawEmail, role, password } = req;
        const email = (0, validators_1.normalizeEmail)(rawEmail);
        // Validation
        if (!email || !(0, validators_1.isValidEmail)(email)) {
            throw new Error('Invalid email');
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        if (!role || !(0, validators_1.isValidRole)(role)) {
            throw new Error('Invalid role');
        }
        if (role === 'admin') {
            throw new Error(constants_1.ERROR_MESSAGES.ADMIN_SIGNUP_DISABLED);
        }
        // Database required
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const exists = await User_1.default.findOne({ email });
        if (exists)
            throw new Error(constants_1.ERROR_MESSAGES.USER_EXISTS);
        const token = (0, token_1.generateToken)();
        const user = await User_1.default.create({
            name: name || 'User',
            email,
            role,
            authToken: token,
            passwordHash: (0, password_1.hashPassword)(password),
            profileVisible: false,
        });
        return {
            user: (0, sanitizer_1.sanitizeUser)(user),
            token,
        };
    }
    /**
     * Login user
     */
    static async login(req) {
        const { email: rawEmail, role, password } = req;
        const email = (0, validators_1.normalizeEmail)(rawEmail);
        if (!email || !password) {
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        // Database required
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const user = role ?
            await User_1.default.findOne({ email, role }) :
            await User_1.default.findOne({ email });
        if (!user) {
            log('[AUTH] login', `User not found: ${email}`);
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        if (!user.passwordHash) {
            log('[AUTH] login', `User has no password hash: ${email}`);
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        if (!(0, password_1.verifyPassword)(password, user.passwordHash)) {
            log('[AUTH] login', `Password mismatch for user: ${email}`);
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        if (user.role === 'admin') {
            throw new Error(constants_1.ERROR_MESSAGES.ADMIN_LOGIN_REQUIRED);
        }
        const token = (0, token_1.generateToken)();
        user.authToken = token;
        await user.save();
        return {
            user: (0, sanitizer_1.sanitizeUser)(user),
            token,
        };
    }
    /**
     * Admin login
     */
    static async adminLogin(email) {
        const normalizedEmail = (0, validators_1.normalizeEmail)(email);
        const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
        if (!adminEmail)
            throw new Error(constants_1.ERROR_MESSAGES.ADMIN_EMAIL_NOT_CONFIGURED);
        if (normalizedEmail !== adminEmail)
            throw new Error(constants_1.ERROR_MESSAGES.NOT_ALLOWED);
        // Database required
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const token = (0, token_1.generateToken)();
        let user = await User_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            user = await User_1.default.create({
                name: 'Admin',
                email: normalizedEmail,
                role: 'admin',
                profileCompleted: true,
                authToken: token,
            });
        }
        else {
            user.role = 'admin';
            user.profileCompleted = true;
            user.authToken = token;
            await user.save();
        }
        return {
            user: (0, sanitizer_1.sanitizeUser)(user),
            token,
        };
    }
    /**
     * Verify token and get user
     */
    static async verifyToken(token) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const user = await User_1.default.findOne({ authToken: token }).select('-passwordHash');
        if (!user)
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_TOKEN);
        return (0, sanitizer_1.sanitizeUser)(user);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map