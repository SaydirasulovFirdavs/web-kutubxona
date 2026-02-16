import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Define dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const booksDir = path.join(uploadDir, 'books');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
}

// Import routes
import authRoutes from './routes/auth.routes.js';
import booksRoutes from './routes/books.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import statsRoutes from './routes/stats.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Security headers - Customize for PDF loading
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Juda ko\'p so\'rovlar yuborildi, keyinroq qayta urinib ko\'ring',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = (req, res, next) => next();

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Web Kutubxona API is running',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Books routes
app.use('/api/books', booksRoutes);

// User routes
app.use('/api/user', userRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Stats routes
app.use('/api/stats', statsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// FRONTEND SERVING (Production)
// ============================================

if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/dist');

    // Serve static files from frontend build
    app.use(express.static(frontendPath));

    // Handle SPA routing - deliver index.html for any unknown route (except /api)
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// 404 handler for API
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API Route topilmadi'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);

    // DEBUG LOGGING
    try {
        fs.appendFileSync(path.join(__dirname, 'debug_log.txt'), `[${new Date().toISOString()}] Global Error: ${err.message}\nStack: ${err.stack}\n`);
    } catch (e) {
        // console.error('Failed to log error to file', e); 
        // Ignore logging error to prevent crash loops
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server xatosi',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// START SERVER
// ============================================

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════════╗
    ║   📚 Web Kutubxona API Server            ║
    ║   🚀 Server running on port ${PORT}         ║
    ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}           ║
    ║   📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'} ║
    ╚═══════════════════════════════════════════╝
        `);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

export default app;
