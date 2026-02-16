import express from 'express';
import {
    startSession,
    endSession,
    getUserStats,
    aiExplain,
    getMyAchievements
} from '../controllers/stats.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/stats/my
 * @desc    Get user's reading stats and streaks
 * @access  Private
 */
router.get('/my', authenticateToken, getUserStats);

/**
 * @route   POST /api/stats/session/start/:id
 * @desc    Start unique reading session for a book
 * @access  Private
 */
router.post('/session/start/:id', authenticateToken, startSession);

/**
 * @route   POST /api/stats/session/end
 * @desc    End reading session and calculate stats
 * @access  Private
 */
router.post('/session/end', authenticateToken, endSession);

/**
 * @route   POST /api/stats/ai/explain
 * @desc    AI Reading Buddy text explanation
 * @access  Private
 */
router.post('/ai/explain', authenticateToken, aiExplain);

/**
 * @route   GET /api/stats/achievements
 * @desc    Get user's earned achievements
 * @access  Private
 */
router.get('/achievements', authenticateToken, getMyAchievements);

export default router;
