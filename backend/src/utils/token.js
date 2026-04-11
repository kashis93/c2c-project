"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDevToken = exports.generateDevToken = exports.generateToken = void 0;
/**
 * Token utilities - generation and parsing
 */
const crypto_1 = __importDefault(require("crypto"));
const generateToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateToken = generateToken;
const generateDevToken = (id, role) => {
    return `${id}:${role}`;
};
exports.generateDevToken = generateDevToken;
const parseDevToken = (token) => {
    const parts = token.split(':');
    if (parts.length !== 2)
        return null;
    const id = parts[0];
    const role = parts[1];
    if (!id || !role)
        return null;
    return { id, role };
};
exports.parseDevToken = parseDevToken;
//# sourceMappingURL=token.js.map