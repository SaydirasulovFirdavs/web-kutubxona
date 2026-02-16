import { query, getClient } from '../config/database.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload new book
 */
// ... imports

/**
 * Upload new book
 */
export const uploadBook = async (req, res) => {
    const client = await getClient();

    try {
        let {
            title, description, author_id, category_ids,
            language_id, publisher, publish_year, pages,
            new_author_name
        } = req.body;

        // File validation - Handle req.files
        const files = req.files || {};
        const bookFile = files['file'] ? files['file'][0] : null;
        const coverImage = files['cover_image'] ? files['cover_image'][0] : null;

        if (!bookFile) {
            return res.status(400).json({
                success: false,
                message: 'Kitob fayli (PDF) yuklanmagan'
            });
        }

        await client.query('BEGIN');

        // 0. Handle new author creation
        if (new_author_name) {
            const authorResult = await client.query(
                'INSERT INTO authors (name) VALUES ($1) RETURNING id',
                [new_author_name]
            );
            author_id = authorResult.rows[0].id;
        }

        // 1. Insert book
        // Fix windows paths for both files
        const bookPath = bookFile.path.replace(/\\/g, '/');
        const coverPath = coverImage ? coverImage.path.replace(/\\/g, '/') : null;

        // Determine file format from mimetype or extension
        const fileFormat = bookFile.mimetype === 'application/epub+zip' ? 'epub' : 'pdf';

        // Sanitize integer fields
        const safeAuthorId = (!author_id || author_id === 'null' || author_id === '') ? null : author_id;
        const safeLanguageId = (!language_id || language_id === 'null' || language_id === '') ? null : language_id;
        const safePublishYear = (!publish_year || publish_year === 'null' || publish_year === '') ? null : publish_year;
        const safePages = (!pages || pages === 'null' || pages === '') ? null : pages;

        const bookResult = await client.query(
            `INSERT INTO books (
                title, description, author_id, language_id, 
                publisher, publish_year, pages, file_path, 
                file_format, file_size, status, uploaded_by,
                cover_image
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id`,
            [
                title, description, safeAuthorId, safeLanguageId,
                publisher, safePublishYear, safePages,
                bookPath,
                fileFormat, bookFile.size, 'active', req.user.id,
                coverPath
            ]
        );

        const bookId = bookResult.rows[0].id;

        // 2. Insert categories
        if (category_ids || req.body.new_category_name) {
            let categories = [];
            if (category_ids) {
                categories = Array.isArray(category_ids) ? [...category_ids] : [category_ids];
            }

            // Handle new category creation
            if (req.body.new_category_name) {
                const slug = req.body.new_category_name.toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                const catResult = await client.query(
                    'INSERT INTO categories (name_uz, slug) VALUES ($1, $2) RETURNING id',
                    [req.body.new_category_name, slug]
                );
                categories.push(catResult.rows[0].id);
            }

            for (const catId of categories) {
                await client.query(
                    `INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)`,
                    [bookId, catId]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Kitob muvaffaqiyatli yuklandi',
            data: { id: bookId }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        // Delete uploaded files if error
        const files = req.files || {};
        if (files['file']) fs.unlink(files['file'][0].path, () => { });
        if (files['cover_image']) fs.unlink(files['cover_image'][0].path, () => { });

        console.error('Upload book error:', error);

        // DEBUG LOGGING
        try {
            fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Upload Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) {
            console.error('Failed to write debug log', e);
        }

        res.status(500).json({
            success: false,
            message: 'Kitob yuklashda xatolik yuz berdi'
        });
    } finally {
        client.release();
    }
};

/**
 * Update book
 */
export const updateBook = async (req, res) => {
    const client = await getClient();

    try {
        const { id } = req.params;
        let {
            title, description, author_id, category_ids,
            language_id, publisher, publish_year, pages,
            new_author_name
        } = req.body;

        await client.query('BEGIN'); // Start transaction for all updates

        // Handle new author creation
        if (new_author_name) {
            const authorResult = await client.query(
                'INSERT INTO authors (name) VALUES ($1) RETURNING id',
                [new_author_name]
            );
            author_id = authorResult.rows[0].id;
        }

        // Sanitize integer fields
        const safeAuthorId = (!author_id || author_id === 'null' || author_id === '') ? null : author_id;
        const safeLanguageId = (!language_id || language_id === 'null' || language_id === '') ? null : language_id;
        const safePublishYear = (!publish_year || publish_year === 'null' || publish_year === '') ? null : publish_year;
        const safePages = (!pages || pages === 'null' || pages === '') ? null : pages;

        // 1. Update book details
        let updateQuery = `
            UPDATE books SET 
                title = $1, description = $2, author_id = $3, 
                language_id = $4, publisher = $5, publish_year = $6, 
                pages = $7, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [
            title, description, safeAuthorId, safeLanguageId,
            publisher, safePublishYear, safePages
        ];
        let paramIndex = 8;

        // Verify files exist in req.files
        const files = req.files || {};

        // If book file is uploaded
        if (files['file']) {
            const bookFile = files['file'][0];
            const bookPath = bookFile.path.replace(/\\/g, '/');
            const fileFormat = bookFile.mimetype === 'application/epub+zip' ? 'epub' : 'pdf';

            updateQuery += `, file_path = $${paramIndex}, file_format = '${fileFormat}', file_size = $${paramIndex + 1}`;
            params.push(bookPath, bookFile.size);
            paramIndex += 2;
        }

        // If cover image is uploaded
        if (files['cover_image']) {
            const coverImage = files['cover_image'][0];
            const coverPath = coverImage.path.replace(/\\/g, '/');

            updateQuery += `, cover_image = $${paramIndex}`;
            params.push(coverPath);
            paramIndex += 1;
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING id`;
        params.push(id);

        const result = await client.query(updateQuery, params);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // 2. Update categories (if provided)
        if (category_ids || req.body.new_category_name) {
            // Delete existing
            await client.query('DELETE FROM book_categories WHERE book_id = $1', [id]);

            let categories = [];
            if (category_ids) {
                categories = Array.isArray(category_ids) ? [...category_ids] : [category_ids];
            }

            // Handle new category creation
            if (req.body.new_category_name) {
                const slug = req.body.new_category_name.toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                const catResult = await client.query(
                    'INSERT INTO categories (name_uz, slug) VALUES ($1, $2) RETURNING id',
                    [req.body.new_category_name, slug]
                );
                categories.push(catResult.rows[0].id);
            }

            // Insert new
            for (const catId of categories) {
                await client.query(
                    `INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)`,
                    [id, catId]
                );
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Kitob ma\'lumotlari yangilandi'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        // Delete uploaded file if error
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        console.error('Update book error:', error);
        res.status(500).json({
            success: false,
            message: `Kitobni yangilashda xatolik: ${error.message}`
        });
    } finally {
        client.release();
    }
};

/**
 * Get all users
 */
export const getUsers = async (req, res) => {
    try {
        const { search, role, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            whereClause += ` AND role_id = (SELECT id FROM roles WHERE name = $${paramIndex})`;
            params.push(role);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Get count
        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );
        const totalUsers = parseInt(countResult.rows[0].count);

        // Get users
        const usersResult = await query(
            `SELECT u.id, u.email, u.full_name, u.status, u.created_at, u.last_login,
                    r.name as role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: {
                users: usersResult.rows,
                pagination: {
                    total: totalUsers,
                    page: parseInt(page),
                    pages: Math.ceil(totalUsers / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Foydalanuvchilarni olishda xatolik'
        });
    }
};

/**
 * Update user status
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri status'
            });
        }

        await query(
            'UPDATE users SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({
            success: true,
            message: 'Status o\'zgartirildi'
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Statusni o\'zgartirishda xatolik'
        });
    }
};

/**
 * Get Dashboard Analytics
 */
export const getAnalytics = async (req, res) => {
    try {
        // Total stats
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM books WHERE status = 'active') as total_books,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT SUM(download_count) FROM books) as total_downloads,
                (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
        `);

        // Recent downloads
        const recentDownloads = await query(`
            SELECT b.title, u.full_name, dh.downloaded_at
            FROM download_history dh
            JOIN books b ON dh.book_id = b.id
            JOIN users u ON dh.user_id = u.id
            ORDER BY dh.downloaded_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: stats.rows[0],
                recent_downloads: recentDownloads.rows
            }
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Statistikani olishda xatolik'
        });
    }
};

/**
 * Delete book
 */
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if book exists
        const bookResult = await query(
            'SELECT file_path FROM books WHERE id = $1',
            [id]
        );

        if (bookResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Soft delete
        await query(
            "UPDATE books SET status = 'deleted' WHERE id = $1",
            [id]
        );

        res.json({
            success: true,
            message: 'Kitob o\'chirildi'
        });

    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({
            success: false,
            message: 'Kitobni o\'chirishda xatolik'
        });
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // role name: 'user', 'admin', 'super_admin'

        // Validate role
        const roleResult = await query(
            'SELECT id FROM roles WHERE name = $1',
            [role]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri rol'
            });
        }

        const roleId = roleResult.rows[0].id;

        // Perform update
        await query(
            'UPDATE users SET role_id = $1 WHERE id = $2',
            [roleId, id]
        );

        res.json({
            success: true,
            message: `Foydalanuvchi roli ${role} ga o'zgartirildi`
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Rolni o\'zgartirishda xatolik'
        });
    }
};

/**
 * Get resources (authors, languages, categories) for form
 */
export const getResources = async (req, res) => {
    try {
        const authors = await query('SELECT id, name FROM authors ORDER BY name');
        const languages = await query('SELECT id, name, code FROM languages ORDER BY name');
        const categories = await query('SELECT id, name_uz, slug FROM categories ORDER BY name_uz'); // Assuming categories exist

        res.json({
            success: true,
            data: {
                authors: authors.rows,
                languages: languages.rows,
                categories: categories.rows
            }
        });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Resurslarni olishda xatolik'
        });
    }
};

export default {
    uploadBook,
    getUsers,
    updateUserStatus,
    getAnalytics,
    deleteBook,
    updateBook,
    updateUserRole,
    getResources
};
