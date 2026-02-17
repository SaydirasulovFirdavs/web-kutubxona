console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
console.log('!! SERVER.JS STARTING AT:', new Date().toISOString());
console.log('!! CWD:', process.cwd());
console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

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

// Security headers - Customize for PDF loading and previews
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "connect-src": ["'self'", "https:", "http:"],
        },
    },
}));

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // Universal allow for production debug - will refine later if needed
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded books
app.use('/uploads', express.static(uploadDir));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Juda ko\'p so\'rovlar yuborildi, keyinroq qayta urinib ko\'ring',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// ROUTES
// ============================================

// API Routes
// ============================================

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// ============================================
// FRONTEND SERVING (Production)
// ============================================

if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(__dirname, '../frontend/dist');
    console.log(`[Production] Serving frontend from: ${frontendPath}`);

    // Serve static files from frontend build
    app.use(express.static(frontendPath));

    // Handle SPA routing
    app.get('*', (req, res, next) => {
        // Skip API and uploads
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }

        const indexPath = path.join(frontendPath, 'index.html');
        // Extra check for index.html existence to provide helpful error
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send(`
                <h1>Frontend index.html topilmadi</h1>
                <p>Qidirilayotgan joy: ${indexPath}</p>
                <p>Mavjud fayllar: ${fs.existsSync(frontendPath) ? fs.readdirSync(frontendPath).join(', ') : 'Papkasi yo\'q'}</p>
            `);
        }
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
    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`
    ╔═══════════════════════════════════════════╗
    ║   📚 Web Kutubxona API Server            ║
    ║   🚀 Server running on port ${PORT}         ║
    ║   🌐 Binding to: 0.0.0.0                  ║
    ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}           ║
    ║   📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'} ║
    ╚═══════════════════════════════════════════╝
        `);

        // Database Background Tasks (Production only or as needed)
        try {
            console.log('⏳ Starting background database check...');
            const { initDB } = await import('./init_db.js');
            const { seedAdmin } = await import('./seed_admin.js');

            await initDB();
            console.log('✅ DB Schema verified.');

            await seedAdmin();
            console.log('✅ Admin credentials verified.');
        } catch (dbErr) {
            console.error('⚠️ Background DB init warning:', dbErr.message);
            // We don't exit(1) here to keep the server alive even if DB has issues temporarily
        }
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

export default app;
