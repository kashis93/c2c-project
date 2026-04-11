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
const activitySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['question_asked', 'answer_posted', 'blog_created', 'challenge_created', 'event_created', 'user_signup', 'blog_liked', 'question_answered'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    // Reference to the related content
    relatedId: { type: mongoose_1.Schema.Types.ObjectId },
    relatedType: {
        type: String,
        enum: ['Question', 'Answer', 'Blog', 'Challenge', 'Event', 'User'],
    },
    // Visibility: who can see this activity
    visibility: {
        type: String,
        enum: ['public', 'alumni', 'students', 'private'],
        default: 'public'
    },
    // For notifications
    readBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
// Index for efficient querying
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ visibility: 1, createdAt: -1 });
const Activity = mongoose_1.default.models.Activity || mongoose_1.default.model('Activity', activitySchema);
exports.default = Activity;
//# sourceMappingURL=Activity.js.map