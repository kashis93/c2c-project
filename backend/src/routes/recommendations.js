"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const recommendationController_1 = require("../controllers/recommendationController");
const router = (0, express_1.Router)();
router.get('/alumni', authMiddleware_1.requireAuth, recommendationController_1.getRecommendedAlumni);
exports.default = router;
//# sourceMappingURL=recommendations.js.map