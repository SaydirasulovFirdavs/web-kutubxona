import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist (with try-catch)
try {
    const uploadDir = path.join(__dirname, 'uploads');
    const booksDir = path.join(__dirname, 'uploads', 'books');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });
} catch (e) {
    console.warn('⚠️ FS warning (uploads):', e.message);
}

// Basic Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.routes.js';
import booksRoutes from './routes/books.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import statsRoutes from './routes/stats.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not Found' }));

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server xatosi',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});
