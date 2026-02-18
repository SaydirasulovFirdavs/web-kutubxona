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

// Trust proxy for Railway/Load Balancers
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Rate limiter
// app.use('/api/', limiter); // User can re-enable later if needed, keeping it disabled for now as requested

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

// Health Checks (Unprotected)
app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString(), env: process.env.NODE_ENV }));
app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));

// Debug Log Endpoint (Root Level to bypass /api handlers)
app.get('/debug-logs', (req, res) => {
    try {
        const logPath = path.join(__dirname, 'debug_log.txt');
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf8').split('\n');
            const lastLines = logs.slice(-500).join('\n');
            res.header('Content-Type', 'text/plain').send(lastLines);
        } else {
            res.send('No debug log file found at: ' + logPath);
        }
    } catch (e) {
        res.status(500).send('Error reading logs: ' + e.message);
    }
});

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Juda ko\'p so\'rovlar yuborildi, keyinroq qayta urinib ko\'ring',
    standardHeaders: true,
    legacyHeaders: false,
});

// app.use('/api/', limiter);

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', (req, res, next) => {
    const logMsg = `[${new Date().toISOString()}] 🔍 DEBUG: Just before Auth Router: ${req.method} ${req.url}\n`;
    console.log(logMsg);
    try { fs.appendFileSync(path.join(__dirname, 'debug_log.txt'), logMsg); } catch (e) { }
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/stats', (req, res, next) => {
    console.log('!!! DEBUG: REACHED STATS ROUTE');
    next();
});

// REMOVED DUPLICATE DEBUG ROUTE FROM HERE

// ============================================
// FRONTEND SERVING (Production)
// ============================================
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(__dirname, '../frontend/dist');
    app.use(express.static(frontendPath));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// 404 handler for API
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API Route topilmadi' });
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
        // Temporarily enable stack/detail in production to catch the "failed to respond" cause
        debug_info: err.stack,
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
