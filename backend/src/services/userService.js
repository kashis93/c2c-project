"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
/**
 * User Service
 * Handles user-related operations and profile management
 */
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const sanitizer_1 = require("../utils/sanitizer");
const validators_1 = require("../utils/validators");
const constants_1 = require("../constants");
class UserService {
    /**
     * Get all visible user profiles
     */
    static async getAllVisibleUsers() {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const users = await User_1.default.find({ profileCompleted: true, profileVisible: true })
            .select('-passwordHash -authToken')
            .sort({ createdAt: -1 });
        return users;
    }
    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        if (!mongoose_1.default.isValidObjectId(userId)) {
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_USER_ID);
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const user = await User_1.default.findById(userId).select('-passwordHash -authToken');
        if (!user)
            throw new Error(constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
        if (!user.profileVisible || !user.profileCompleted) {
            throw new Error(constants_1.ERROR_MESSAGES.PROFILE_NOT_VISIBLE);
        }
        return (0, sanitizer_1.sanitizePublicUser)(user);
    }
    /**
     * Get current user profile
     */
    static async getUserProfile(userId) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const user = await User_1.default.findById(userId).select('-passwordHash');
        if (!user)
            throw new Error(constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
        return (0, sanitizer_1.sanitizePublicUser)(user);
    }
    /**
     * Update user profile
     */
    static async updateProfile(userId, role, data) {
        // Validate based on role
        if (role === 'student') {
            const validation = (0, validators_1.validateStudentProfile)(data);
            if (!validation.valid) {
                throw new Error(`Missing/invalid required fields: ${validation.errors.join(', ')}`);
            }
        }
        else if (role === 'alumni') {
            const validation = (0, validators_1.validateAlumniProfile)(data);
            if (!validation.valid) {
                throw new Error(`Missing/invalid required fields: ${validation.errors.join(', ')}`);
            }
        }
        // Build updates object
        const updates = {
            profileCompleted: true,
            profileVisible: true,
        };
        if (role === 'student') {
            if ((0, validators_1.isNonEmptyString)(data.year))
                updates.year = data.year?.trim();
            if ((0, validators_1.isNonEmptyString)(data.branch))
                updates.branch = data.branch?.trim();
            if ((0, validators_1.isStringArray)(data.skills))
                updates.skills = data.skills;
            if ((0, validators_1.isStringArray)(data.interests))
                updates.interests = data.interests;
            if ((0, validators_1.isStringArray)(data.projects))
                updates.projects = data.projects;
        }
        else if (role === 'alumni') {
            if ((0, validators_1.isNonEmptyString)(data.company))
                updates.company = data.company?.trim();
            if ((0, validators_1.isNonEmptyString)(data.position))
                updates.position = data.position?.trim();
            if ((0, validators_1.isNonEmptyString)(data.domain))
                updates.domain = data.domain?.trim();
            if ((0, validators_1.isPositiveNumber)(data.yearsOfExperience))
                updates.yearsOfExperience = data.yearsOfExperience;
            if ((0, validators_1.isNonEmptyString)(data.availability))
                updates.availability = data.availability?.trim();
            if ((0, validators_1.isStringArray)(data.capabilities))
                updates.capabilities = data.capabilities;
            if (typeof data.linkedinUrl === 'string')
                updates.linkedinUrl = data.linkedinUrl.trim();
            if (typeof data.githubUrl === 'string')
                updates.githubUrl = data.githubUrl.trim();
            if (typeof data.personalWebsite === 'string')
                updates.personalWebsite = data.personalWebsite.trim();
            if ((0, validators_1.isNonEmptyString)(data.bio))
                updates.bio = data.bio?.trim();
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const updated = await User_1.default.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-passwordHash');
        if (!updated)
            throw new Error(constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
        return (0, sanitizer_1.sanitizePublicUser)(updated);
    }
    /**
     * Toggle profile visibility
     */
    static async toggleProfileVisibility(userId, visible) {
        if (!mongoose_1.default.isValidObjectId(userId)) {
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_USER_ID);
        }
        if (mongoose_1.default.connection.readyState === 1) {
            const updated = await User_1.default.findByIdAndUpdate(userId, { $set: { profileVisible: visible } }, { new: true }).select('-passwordHash');
            if (!updated)
                throw new Error(constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
            return (0, sanitizer_1.sanitizePublicUser)(updated);
        }
        throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
    }
    /**
     * Create user (admin only)
     */
    static async createUser(name, email, role) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const exists = await User_1.default.findOne({ email });
        if (exists)
            throw new Error(constants_1.ERROR_MESSAGES.USER_EXISTS);
        const user = await User_1.default.create({
            name: name || 'User',
            email,
            role,
        });
        return (0, sanitizer_1.sanitizePublicUser)(user);
    }
    /**
     * Search users by name or email
     */
    static async searchUsers(query) {
        if (!query || query.length < 2) {
            throw new Error('Search query must be at least 2 characters');
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error(constants_1.ERROR_MESSAGES.DB_NOT_CONNECTED);
        }
        const users = await User_1.default.find({
            $and: [
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                    ],
                },
                { profileCompleted: true, profileVisible: true },
            ],
        }, { profileCompleted: 1, profileVisible: 1, name: 1, email: 1, role: 1, company: 1, position: 1 }).limit(20);
        return users;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map