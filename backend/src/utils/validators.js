"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRole = exports.normalizeEmail = exports.validateAlumniProfile = exports.validateStudentProfile = exports.isValidUrlOrEmpty = exports.isValidUrl = exports.isValidEmail = exports.isPositiveNumber = exports.isStringArray = exports.isNonEmptyString = void 0;
const constants_1 = require("../constants");
const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};
exports.isNonEmptyString = isNonEmptyString;
const isStringArray = (value) => {
    return Array.isArray(value) && value.every((x) => typeof x === 'string');
};
exports.isStringArray = isStringArray;
const isPositiveNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
};
exports.isPositiveNumber = isPositiveNumber;
const isValidEmail = (email) => {
    return constants_1.VALIDATION_RULES.EMAIL_REGEX.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidUrl = (url) => {
    if (url.trim() === '')
        return true;
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const isValidUrlOrEmpty = (value) => {
    if (value === undefined || value === null)
        return true;
    if (typeof value !== 'string')
        return false;
    if (value.trim() === '')
        return true;
    return (0, exports.isValidUrl)(value);
};
exports.isValidUrlOrEmpty = isValidUrlOrEmpty;
/**
 * Validate student profile fields
 */
const validateStudentProfile = (data) => {
    const errors = [];
    if (!(0, exports.isNonEmptyString)(data.year))
        errors.push('year');
    if (!(0, exports.isNonEmptyString)(data.branch))
        errors.push('branch');
    if (!(0, exports.isStringArray)(data.skills) || data.skills.length === 0)
        errors.push('skills');
    if (!(0, exports.isStringArray)(data.interests) || data.interests.length === 0)
        errors.push('interests');
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateStudentProfile = validateStudentProfile;
/**
 * Validate alumni profile fields
 */
const validateAlumniProfile = (data) => {
    const errors = [];
    if (!(0, exports.isNonEmptyString)(data.company))
        errors.push('company');
    if (!(0, exports.isNonEmptyString)(data.position))
        errors.push('position');
    if (!(0, exports.isNonEmptyString)(data.domain))
        errors.push('domain');
    if (!(0, exports.isPositiveNumber)(data.yearsOfExperience))
        errors.push('yearsOfExperience');
    if (!(0, exports.isNonEmptyString)(data.availability))
        errors.push('availability');
    if (!(0, exports.isStringArray)(data.capabilities) || data.capabilities.length === 0)
        errors.push('capabilities');
    if (!(0, exports.isValidUrlOrEmpty)(data.linkedinUrl))
        errors.push('linkedinUrl');
    if (!(0, exports.isValidUrlOrEmpty)(data.githubUrl))
        errors.push('githubUrl');
    if (!(0, exports.isValidUrlOrEmpty)(data.personalWebsite))
        errors.push('personalWebsite');
    if (!(0, exports.isNonEmptyString)(data.bio))
        errors.push('bio');
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateAlumniProfile = validateAlumniProfile;
/**
 * Normalize email to lowercase
 */
const normalizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.normalizeEmail = normalizeEmail;
/**
 * Check if valid user role
 */
const isValidRole = (role) => {
    return role === 'student' || role === 'alumni' || role === 'admin';
};
exports.isValidRole = isValidRole;
//# sourceMappingURL=validators.js.map