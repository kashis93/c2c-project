"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const submissionSchema = new mongoose_1.Schema({
    id: { type: String, default: () => new mongoose_1.default.Types.ObjectId().toString(), index: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: () => new Date() },
    status: { type: String },
}, { _id: false });
const challengeSchema = new mongoose_1.Schema({
    id: { type: String, default: () => new mongoose_1.default.Types.ObjectId().toString(), index: true },
    authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    companyName: { type: String, default: '' },
    domain: { type: String, default: '' },
    batchYear: { type: String, default: '' },
    problemStatement: { type: String, default: '' },
    skillsRequired: { type: String, default: '' },
    expectedDeliverables: { type: String, default: '' },
    difficulty: { type: String, default: 'beginner' },
    duration: { type: String, default: '1week' },
    prize: { type: String },
    cashReward: { type: String, default: '' },
    internshipReward: { type: Boolean, default: false },
    certificateReward: { type: Boolean, default: false },
    mentorshipReward: { type: Boolean, default: false },
    otherRewards: { type: String, default: '' },
    deadline: { type: Date },
    registrationLink: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    deadline: { type: Date },
    submissions: [submissionSchema],
}, { timestamps: true });
const Challenge = (mongoose_1.default.models.Challenge ? mongoose_1.default.models.Challenge : mongoose_1.default.model('Challenge', challengeSchema));
exports.default = Challenge;
//# sourceMappingURL=Challenge.js.map