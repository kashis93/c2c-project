"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
/**
 * Password utilities - hashing and verification
 */
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("../constants");
const hashPassword = (password) => {
    const iterations = constants_1.PASSWORDS.ITERATIONS;
    const salt = crypto_1.default.randomBytes(16);
    const derivedKey = crypto_1.default.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    return `${constants_1.PASSWORDS.ALGORITHM}$${iterations}$${salt.toString('base64')}$${derivedKey.toString('base64')}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, stored) => {
    try {
        const [algo, iterRaw, saltB64, hashB64] = stored.split('$');
        if (algo !== constants_1.PASSWORDS.ALGORITHM)
            return false;
        const iterations = Number(iterRaw);
        if (!Number.isFinite(iterations) || iterations <= 0)
            return false;
        if (!saltB64 || !hashB64)
            return false;
        const salt = Buffer.from(saltB64, 'base64');
        const expected = Buffer.from(hashB64, 'base64');
        const actual = crypto_1.default.pbkdf2Sync(password, salt, iterations, expected.length, 'sha256');
        if (expected.length !== actual.length)
            return false;
        return crypto_1.default.timingSafeEqual(expected, actual);
    }
    catch {
        return false;
    }
};
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=password.js.map