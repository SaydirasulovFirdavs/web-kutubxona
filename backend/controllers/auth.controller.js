import { query, getClient } from '../config/database.js';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateRandomToken
} from '../utils/security.js';
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
} from '../services/email.service.js';

/**
 * Register new user
 */
export const register = async (req, res) => {
    const client = await getClient();

    try {
        const { email, password, fullName } = req.body;

        // Validate input
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password va to\'liq ism talab qilinadi'
            });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Bu email allaqachon ro\'yxatdan o\'tgan'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate verification token
        const verificationToken = generateRandomToken();

        await client.query('BEGIN');

        // Insert user
        const result = await client.query(
            `INSERT INTO users (email, password_hash, full_name, verification_token, status, email_verified)
             VALUES ($1, $2, $3, $4, 'active', true)
             RETURNING id, email, full_name, created_at`,
            [email.toLowerCase(), passwordHash, fullName, verificationToken]
        );

        const user = result.rows[0];

        // Log registration event
        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
             VALUES ($1, 'user_registration', 'user', $2, $3, $4)`,
            [user.id, user.id, req.ip, req.get('user-agent')]
        );

        await client.query('COMMIT');

        // Send verification email
        await sendVerificationEmail(email, fullName, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Ro\'yxatdan o\'tish muvaffaqiyatli! Endi kirishingiz mumkin.',
            data: {
                userId: user.id,
                email: user.email,
                fullName: user.full_name
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Ro\'yxatdan o\'tishda xatolik yuz berdi'
        });
    } finally {
        client.release();
    }
};

/**
 * Verify email
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token talab qilinadi'
            });
        }

        const result = await query(
            `UPDATE users 
             SET email_verified = true, status = 'active', verification_token = NULL
             WHERE verification_token = $1 AND status = 'pending'
             RETURNING id, email, full_name`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri yoki muddati o\'tgan token'
            });
        }

        const user = result.rows[0];

        // Send welcome email
        await sendWelcomeEmail(user.email, user.full_name);

        res.json({
            success: true,
            message: 'Email muvaffaqiyatli tasdiqlandi!'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email tasdiqlanishida xatolik yuz berdi'
        });
    }
};

console.log('🔍 DEBUG: auth.controller.js module is being loaded');

/**
 * Login
 */
export const login = async (req, res) => {
    console.log('🔍 DEBUG: Reached login function in controller');
    const client = await getClient();
    console.log('🔍 DEBUG: Got DB client');

    try {
        const { email, password } = req.body;
        console.log(`🔍 DEBUG: Login attempt for: ${email}`);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email va parol talab qilinadi'
            });
        }

        // Get user with role
        console.log(`🔍 DEBUG: Starting DB query for user: ${email}`);
        const dbStartTime = Date.now();
        const result = await client.query(
            `SELECT u.id, u.email, u.password_hash, u.full_name, u.status, 
                    u.email_verified, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email.toLowerCase()]
        );
        const dbDuration = Date.now() - dbStartTime;
        console.log(`🔍 DEBUG: DB query finished in ${dbDuration}ms for user: ${email}`);

        if (result.rows.length === 0) {
            console.log(`🔍 Login attempt failed: User not found [${email}]`);
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri'
            });
        }

        const user = result.rows[0];
        console.log(`🔍 Found user: ${user.email}, Status: ${user.status}, Role: ${user.role}`);

        // Check if email is verified
        if (!user.email_verified) {
            console.log(`🔍 Login failed: Email not verified [${email}]`);
            return res.status(403).json({
                success: false,
                message: 'Iltimos, avval emailingizni tasdiqlang'
            });
        }

        // Check if account is active
        if (user.status !== 'active') {
            console.log(`🔍 Login failed: Account not active [${email}, status: ${user.status}]`);
            return res.status(403).json({
                success: false,
                message: 'Hisobingiz bloklangan. Administrator bilan bog\'laning'
            });
        }

        // Verify password
        console.log(`🔍 STARTING password validation for: ${email}`);
        const startTime = Date.now();
        const isPasswordValid = await comparePassword(password, user.password_hash);
        const duration = Date.now() - startTime;
        console.log(`🔍 Password validation: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'} (took ${duration}ms)`);

        if (!isPasswordValid) {
            console.log(`🔍 Login failed: Invalid password for ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        await client.query('BEGIN');

        // Save refresh token in sessions
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await client.query(
            `INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, refreshToken, req.ip, req.get('user-agent'), expiresAt]
        );

        // Update last login
        await client.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log login event
        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
             VALUES ($1, 'user_login', 'user', $2, $3, $4)`,
            [user.id, user.id, req.ip, req.get('user-agent')]
        );

        await client.query('COMMIT');

        return res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('🔍 DEBUG: Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi'
        });
    } finally {
        if (client) {
            console.log('🔍 DEBUG: Releasing DB client');
            client.release();
        }
    }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token talab qilinadi'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: 'Noto\'g\'ri yoki muddati o\'tgan refresh token'
            });
        }

        // Check if session exists
        const sessionResult = await query(
            `SELECT s.user_id, r.name as role
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             JOIN roles r ON u.role_id = r.id
             WHERE s.refresh_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active'`,
            [refreshToken]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Session topilmadi yoki muddati o\'tgan'
            });
        }

        const { user_id, role } = sessionResult.rows[0];

        // Generate new access token
        const newAccessToken = generateAccessToken(user_id, role);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Token yangilanishida xatolik yuz berdi'
        });
    }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete session
            await query(
                'DELETE FROM sessions WHERE refresh_token = $1',
                [refreshToken]
            );
        }

        res.json({
            success: true,
            message: 'Muvaffaqiyatli chiqdingiz'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Chiqishda xatolik yuz berdi'
        });
    }
};

/**
 * Forgot password
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email talab qilinadi'
            });
        }

        const result = await query(
            'SELECT id, email, full_name FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        // Don't reveal if email exists or not (security)
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Agar email ro\'yxatdan o\'tgan bo\'lsa, parolni tiklash havolasi yuboriladi'
            });
        }

        const user = result.rows[0];

        // Generate reset token
        const resetToken = generateRandomToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

        await query(
            `UPDATE users 
             SET reset_password_token = $1, reset_password_expires = $2
             WHERE id = $3`,
            [resetToken, expiresAt, user.id]
        );

        // Send reset email
        await sendPasswordResetEmail(user.email, user.full_name, resetToken);

        res.json({
            success: true,
            message: 'Agar email ro\'yxatdan o\'tgan bo\'lsa, parolni tiklash havolasi yuboriladi'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Parolni tiklashda xatolik yuz berdi'
        });
    }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token va yangi parol talab qilinadi'
            });
        }

        // Find user with valid reset token
        const result = await query(
            `SELECT id FROM users 
             WHERE reset_password_token = $1 
             AND reset_password_expires > CURRENT_TIMESTAMP`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri yoki muddati o\'tgan token'
            });
        }

        const userId = result.rows[0].id;

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password and clear reset token
        await query(
            `UPDATE users 
             SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
             WHERE id = $2`,
            [passwordHash, userId]
        );

        // Delete all sessions for this user (force re-login)
        await query('DELETE FROM sessions WHERE user_id = $1', [userId]);

        res.json({
            success: true,
            message: 'Parol muvaffaqiyatli o\'zgartirildi'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Parolni o\'zgartirishda xatolik yuz berdi'
        });
    }
};

export default {
    register,
    verifyEmail,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword
};
