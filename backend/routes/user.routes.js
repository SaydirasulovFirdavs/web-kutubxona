import express from 'express';
import {
    getProfile,
    updateProfile,
    getLibrary,
    addToLibrary,
    removeFromLibrary,
    getHistory,
    removeFromHistory
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   GET /api/user/library
 * @desc    Get user's library
 * @access  Private
 */
router.get('/library', getLibrary);

/**
 * @route   POST /api/user/library
 * @desc    Add book to user library
 * @access  Private
 */
router.post('/library', addToLibrary);

/**
 * @route   DELETE /api/user/library/:bookId
 * @desc    Remove book from user library
 * @access  Private
 */
router.delete('/library/:bookId', removeFromLibrary);

/**
 * @route   GET /api/user/history
 * @desc    Get user download history
 * @access  Private
 */
router.get('/history', getHistory);

/**
 * @route   DELETE /api/user/history/:id
 * @desc    Remove from download history
 * @access  Private
 */
router.delete('/history/:id', removeFromHistory);

export default router;
