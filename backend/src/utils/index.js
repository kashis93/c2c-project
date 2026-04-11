"use strict";
/**
 * General utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.log = exports.getErrorMessage = exports.omitFields = exports.pickFields = exports.safeJsonParse = exports.delay = exports.isObjectId = exports.getBearerToken = void 0;
const getBearerToken = (authHeader) => {
    if (!authHeader)
        return null;
    const token = authHeader.replace('Bearer ', '').trim();
    return token || null;
};
exports.getBearerToken = getBearerToken;
const isObjectId = (id) => {
    return typeof id === 'string' && id.length === 24 && /^[0-9a-f]{24}$/.test(id);
};
exports.isObjectId = isObjectId;
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
const safeJsonParse = (json, defaultValue) => {
    try {
        return JSON.parse(json);
    }
    catch {
        return defaultValue;
    }
};
exports.safeJsonParse = safeJsonParse;
const pickFields = (obj, fields) => {
    const result = {};
    fields.forEach(field => {
        if (field in obj) {
            result[field] = obj[field];
        }
    });
    return result;
};
exports.pickFields = pickFields;
const omitFields = (obj, fields) => {
    const result = { ...obj };
    fields.forEach(field => {
        delete result[field];
    });
    return result;
};
exports.omitFields = omitFields;
/**
 * Convert error to response message
 */
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    return 'An unexpected error occurred';
};
exports.getErrorMessage = getErrorMessage;
/**
 * Log with timestamp
 */
const log = (label, message, data) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${label}`;
    if (data) {
        // eslint-disable-next-line no-console
        console.log(prefix, message, data);
    }
    else {
        // eslint-disable-next-line no-console
        console.log(prefix, message);
    }
};
exports.log = log;
const logError = (label, error) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.error(`[${timestamp}] ${label}:`, error);
};
exports.logError = logError;
//# sourceMappingURL=index.js.map