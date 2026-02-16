import { verifyAccessToken } from '../utils/security.js';
import { query } from '../config/database.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Get user from database
        const result = await query(
            `SELECT u.id, u.email, u.full_name, u.status, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication middleware
 * Does not return 401/403 if token is missing/invalid, just leaves req.user null
 */
export const authenticateTokenOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            req.user = null;
            return next();
        }

        const result = await query(
            `SELECT u.id, u.email, u.full_name, u.status, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [decoded.userId]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is admin or super_admin
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware to check if user is super_admin
 */
export const requireSuperAdmin = requireRole(['super_admin']);

export default {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireSuperAdmin
};
