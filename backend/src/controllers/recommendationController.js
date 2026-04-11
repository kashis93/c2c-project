"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedAlumni = void 0;
const User_1 = __importDefault(require("../models/User"));
const Connection_1 = __importDefault(require("../models/Connection"));
const SearchHistory_1 = __importDefault(require("../models/SearchHistory"));
// Weights for scoring
const SCORES = {
    MUTUAL_CONNECTION: 5,
    SAME_DEPARTMENT: 10,
    INDUSTRY_MATCH: 8,
    SEARCH_HISTORY_MATCH: 6,
    PROFILE_VIEW_BOOST: 2,
    RECENT_ACTIVITY: 3,
};
const getRecommendedAlumni = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentUser = await User_1.default.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // 1. Get IDs of users already connected to exclude them
        const existingConnections = await Connection_1.default.find({
            $or: [{ followerId: userId }, { followingId: userId }]
        });
        // Set of IDs to exclude (self + already connected)
        const excludeIds = new Set(existingConnections.map(c => c.followerId.toString() === userId ? c.followingId.toString() : c.followerId.toString()));
        excludeIds.add(userId);
        // 2. Fetch Potential Candidates (Alumni only, or Students too depending on req? Req says "Recommended Alumni")
        const candidates = await User_1.default.find({
            _id: { $nin: Array.from(excludeIds) },
            role: 'alumni' // strict requirement: Recommend Alumni
        }).limit(200).lean();
        // 3. Pre-fetch necessary data for scoring (Batch processing)
        // A. Search History of current user
        const searchHistory = await SearchHistory_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        const relevantKeywords = new Set(searchHistory.map(sh => (sh.query || '').toLowerCase()).filter(Boolean));
        // B. Get all connections of current user (users I follow) - needed for mutuals
        const myConnectionIds = existingConnections.map(c => c.followerId.toString() === userId ? c.followingId.toString() : c.followerId.toString());
        // Find connections where one party is in 'candidates' and other is in 'myConnectionIds'
        const candidatesConnectionDocs = await Connection_1.default.find({
            $or: [
                { followerId: { $in: candidates.map(c => c._id) }, followingId: { $in: myConnectionIds } },
                { followingId: { $in: candidates.map(c => c._id) }, followerId: { $in: myConnectionIds } }
            ]
        }).lean();
        // Map candidateId -> count of mutuals
        const mutualsCountMap = {};
        candidatesConnectionDocs.forEach(c => {
            const p1 = c.followerId.toString();
            const p2 = c.followingId.toString();
            const candidateId = candidates.find(cand => cand._id.toString() === p1 || cand._id.toString() === p2)?._id.toString();
            if (candidateId) {
                mutualsCountMap[candidateId] = (mutualsCountMap[candidateId] || 0) + 1;
            }
        });
        // 4. Calculate Scores
        const scoredCandidates = candidates.map((candidate) => {
            let score = 0;
            const reasons = [];
            // A. Mutual Connections
            const mutuals = mutualsCountMap[candidate._id.toString()] || 0;
            if (mutuals > 0) {
                score += mutuals * SCORES.MUTUAL_CONNECTION;
                reasons.push(`${mutuals} mutual connections`);
            }
            // B. Same Department / College
            if (candidate.department && currentUser.department &&
                candidate.department.toLowerCase() === currentUser.department.toLowerCase()) {
                score += SCORES.SAME_DEPARTMENT;
                reasons.push('Same Department');
            }
            // C. Career Relevance (Industry/Skills match)
            let industryMatch = false;
            const userInterests = currentUser.interests?.map((i) => (typeof i === 'string' ? i.toLowerCase() : '')) || [];
            const userSkills = currentUser.skills?.map((s) => (typeof s === 'string' ? s.toLowerCase() : '')) || [];
            const candidateIndustry = (candidate.domain || candidate.company || '').toLowerCase();
            const candidateSkills = candidate.skills?.map((s) => s.toLowerCase()) || [];
            // Match User Interest -> Candidate Domain/Company
            if (userInterests.some(int => int && candidateIndustry.includes(int))) {
                industryMatch = true;
            }
            // Match User Skills -> Candidate Skills
            const commonSkills = userSkills.filter(s => s && candidateSkills.includes(s));
            if (industryMatch) {
                score += SCORES.INDUSTRY_MATCH;
                reasons.push('Matches your interests');
            }
            if (commonSkills.length > 0) {
                score += (commonSkills.length * 1);
            }
            // D. Search History Influence
            let searchMatch = false;
            relevantKeywords.forEach(keyword => {
                if (!keyword)
                    return;
                if (candidate.name.toLowerCase().includes(keyword) ||
                    (candidate.company || '').toLowerCase().includes(keyword) ||
                    (candidate.domain || '').toLowerCase().includes(keyword)) {
                    searchMatch = true;
                }
            });
            if (searchMatch) {
                score += SCORES.SEARCH_HISTORY_MATCH;
                reasons.push('Based on your recent search');
            }
            // E. Recent Activity
            if (candidate.lastSeen) {
                const daysSinceActive = (new Date().getTime() - new Date(candidate.lastSeen).getTime()) / (1000 * 3600 * 24);
                if (daysSinceActive < 7) {
                    score += SCORES.RECENT_ACTIVITY;
                }
            }
            // Return structure
            return {
                ...candidate,
                score,
                mutualConnections: mutuals,
                reasons
            };
        });
        // 5. Sort by Score DESC
        scoredCandidates.sort((a, b) => b.score - a.score);
        // 6. Return Top Results
        res.json(scoredCandidates.slice(0, 10)); // Return top 10
    }
    catch (error) {
        console.error('Error in recommendations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRecommendedAlumni = getRecommendedAlumni;
//# sourceMappingURL=recommendationController.js.map