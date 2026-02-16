import express from 'express';
import {
    getAllBooks,
    getBookById,
    downloadBook,
    addToLibrary,
    getUserLibrary,
    addReview,
    getReviews,
    getCategories,
    getTrendingBooks,
    getNewBooks,
    getBookmarks,
    addBookmark,
    deleteBookmark,
    getHighlights,
    addHighlight,
    deleteHighlight,
    getPersonalizedRecommendations
} from '../controllers/books.controller.js';
import { authenticateToken, authenticateTokenOptional } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/books/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/books/trending
 * @desc    Get trending books
 * @access  Public
 */
router.get('/trending', getTrendingBooks);

/**
 * @route   GET /api/books/new
 * @desc    Get new arrivals
 * @access  Public
 */
router.get('/new', getNewBooks);
router.get('/recommendations/personalized', authenticateToken, getPersonalizedRecommendations);

/**
 * @route   GET /api/books
 * @desc    Get all books with filters and pagination
 * @access  Public
 */
router.get('/', getAllBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID
 * @access  Public
 */
router.get('/:id', getBookById);

/**
 * @route   POST /api/books/:id/download
 * @desc    Download book
 * @access  Private
 */
router.post('/:id/download', authenticateToken, downloadBook);

/**
 * @route   POST /api/books/library
 * @desc    Add book to user library
 * @access  Private
 */
router.post('/library', authenticateToken, addToLibrary);

/**
 * @route   GET /api/books/library/my
 * @desc    Get user's library
 * @access  Private
 */
router.get('/library/my', authenticateToken, getUserLibrary);

/**
 * @route   GET /api/books/:id/reviews
 * @desc    Get reviews for a book
 * @access  Public (Optional Auth for "is_own_review")
 */
router.get('/:id/reviews', authenticateTokenOptional, getReviews);

/**
 * @route   POST /api/books/:id/review
 * @desc    Add review to book
 * @access  Private
 */
router.post('/:id/review', authenticateToken, addReview);

// Bookmarks routes
router.get('/:id/bookmarks', authenticateToken, getBookmarks);
router.post('/:id/bookmarks', authenticateToken, addBookmark);
router.delete('/bookmarks/:bookmarkId', authenticateToken, deleteBookmark);

// Highlights routes
router.get('/:id/highlights', authenticateToken, getHighlights);
router.post('/:id/highlights', authenticateToken, addHighlight);
router.delete('/highlights/:highlightId', authenticateToken, deleteHighlight);

export default router;
