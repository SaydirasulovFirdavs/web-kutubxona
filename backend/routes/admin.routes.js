import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    uploadBook,
    getUsers,
    updateUserStatus,
    getAnalytics,
    deleteBook,
    updateBook,
    updateUserRole,
    getResources
} from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Multer config for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/books/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'file') {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/epub+zip') {
            cb(null, true);
        } else {
            cb(new Error('Kitob fayli faqat PDF yoki EPUB bo\'lishi kerak!'), false);
        }
    } else if (file.fieldname === 'cover_image') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Muqova faqat rasm bo\'lishi kerak!'), false);
        }
    } else {
        cb(new Error('Kutilmagan fayl!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   POST /api/admin/books
 * @desc    Upload new book (PDF + Cover)
 * @access  Admin
 */
router.post('/books', upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), uploadBook);

/**
 * @route   DELETE /api/admin/books/:id
 * @desc    Delete book (soft delete)
 * @access  Admin
 */
router.delete('/books/:id', deleteBook);

/**
 * @route   PUT /api/admin/books/:id
 * @desc    Update book details
 * @access  Admin
 */
router.put('/books/:id', upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), updateBook);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', getUsers);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status
 * @access  Admin
 */
router.put('/users/:id/status', updateUserStatus);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Super Admin
 */
router.put('/users/:id/role', requireSuperAdmin, updateUserRole);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get dashboard stats
 * @access  Admin
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/admin/resources
 * @desc    Get form resources (authors, languages)
 * @access  Admin
 */
router.get('/resources', getResources);

export default router;
