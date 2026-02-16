import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT id, email, full_name, role_id, status, created_at 
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Profilni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, current_password, new_password } = req.body;

        // 1. Update full name if provided
        if (full_name) {
            await query(
                'UPDATE users SET full_name = $1 WHERE id = $2',
                [full_name, userId]
            );
        }

        // 2. Update password if provided
        if (current_password && new_password) {
            // Get user's current password hash
            const userResult = await query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Foydalanuvchi topilmadi'
                });
            }

            const user = userResult.rows[0];

            // Verify current password
            const isMatch = await bcrypt.compare(current_password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Joriy parol noto\'g\'ri'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            // Update password
            await query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, userId]
            );
        }

        res.json({
            success: true,
            message: 'Profil muvaffaqiyatli yangilandi'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Profilni yangilashda xatolik yuz berdi'
        });
    }
};

/**
 * Get user library
 */
export const getLibrary = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT 
                b.id, b.title, b.description, b.cover_image,
                b.rating_avg, b.rating_count,
                a.name as author_name,
                l.name as language_name,
                ul.added_at
             FROM user_library ul
             JOIN books b ON ul.book_id = b.id
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             WHERE ul.user_id = $1 AND b.status = 'active'
             ORDER BY ul.added_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({
            success: false,
            message: 'Kutubxonani olishda xatolik yuz berdi'
        });
    }
};

/**
 * Add book to library
 */
export const addToLibrary = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;

        // Check if book exists
        const bookExists = await query(
            'SELECT id FROM books WHERE id = $1 AND status = $2',
            [bookId, 'active']
        );

        if (bookExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Add to library (ignore if already exists)
        await query(
            `INSERT INTO user_library (user_id, book_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, book_id) DO NOTHING`,
            [userId, bookId]
        );

        res.json({
            success: true,
            message: 'Kitob kutubxonaga qo\'shildi'
        });

    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({
            success: false,
            message: 'Kutubxonaga qo\'shishda xatolik yuz berdi'
        });
    }
};

/**
 * Remove book from library
 */
export const removeFromLibrary = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.id;

        const result = await query(
            'DELETE FROM user_library WHERE user_id = $1 AND book_id = $2 RETURNING *',
            [userId, bookId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob kutubxonada topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Kitob kutubxonadan o\'chirildi'
        });

    } catch (error) {
        console.error('Remove from library error:', error);
        res.status(500).json({
            success: false,
            message: 'Kutubxonadan o\'chirishda xatolik yuz berdi'
        });
    }
};

/**
 * Get user download history
 */
export const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT 
                dh.id as history_id,
                b.id, b.title, b.cover_image,
                a.name as author_name,
                dh.downloaded_at
             FROM download_history dh
             JOIN books b ON dh.book_id = b.id
             LEFT JOIN authors a ON b.author_id = a.id
             WHERE dh.user_id = $1
             ORDER BY dh.downloaded_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Tarixni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Remove from download history
 */
export const removeFromHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await query(
            'DELETE FROM download_history WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarix topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Tarixdan o\'chirildi'
        });

    } catch (error) {
        console.error('Remove from history error:', error);
        res.status(500).json({
            success: false,
            message: 'Tarixdan o\'chirishda xatolik yuz berdi'
        });
    }
};

export default {
    getProfile,
    updateProfile,
    getLibrary,
    addToLibrary,
    removeFromLibrary,
    getHistory,
    removeFromHistory
};
