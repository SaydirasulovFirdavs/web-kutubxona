import { query, getClient } from '../config/database.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all books with pagination and filters
 */
export const getAllBooks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            language,
            author,
            search,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        // Security: Validate sortBy and sortOrder to prevent SQL Injection
        const allowedSortBy = ['created_at', 'title', 'view_count', 'download_count', 'rating_avg', 'publish_year', 'pages'];
        const allowedSortOrder = ['ASC', 'DESC'];

        const finalSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const offset = (page - 1) * limit;
        let whereClause = "WHERE b.status = 'active'";
        const params = [];
        let paramIndex = 1;

        // Search filter - Enhanced with multi-word support
        if (search) {
            const searchTerms = search.split(/\s+/).filter(t => t.length > 0);
            if (searchTerms.length > 0) {
                const searchConditions = searchTerms.map((_, i) =>
                    `(b.title ILIKE $${paramIndex + i} OR a.name ILIKE $${paramIndex + i} OR b.description ILIKE $${paramIndex + i})`
                ).join(' AND ');

                whereClause += ` AND (${searchConditions})`;
                searchTerms.forEach(term => params.push(`%${term}%`));
                paramIndex += searchTerms.length;
            }
        }

        // Category filter
        if (category) {
            whereClause += ` AND EXISTS (
                SELECT 1 FROM book_categories bc 
                WHERE bc.book_id = b.id AND bc.category_id = $${paramIndex}
            )`;
            params.push(category);
            paramIndex++;
        }

        // Language filter
        if (language) {
            whereClause += ` AND b.language_id = $${paramIndex}`;
            params.push(language);
            paramIndex++;
        }

        // Author filter
        if (author) {
            whereClause += ` AND b.author_id = $${paramIndex}`;
            params.push(author);
            paramIndex++;
        }

        // Featured filter
        if (req.query.is_featured === 'true' || req.query.isFeatured === 'true') {
            whereClause += " AND b.is_featured = true";
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM books b 
             LEFT JOIN authors a ON b.author_id = a.id 
             ${whereClause}`,
            params
        );
        const totalBooks = parseInt(countResult.rows[0].count);

        // Get books
        const result = await query(
            `SELECT 
                b.id, b.title, b.description, b.isbn, b.publisher, 
                b.publish_year, b.pages, b.file_format, b.cover_image,
                b.download_count, b.view_count, b.rating_avg, b.rating_count,
                b.created_at,
                a.name as author_name,
                l.name as language_name,
                l.code as language_code
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             ${whereClause}
             ORDER BY b.${finalSortBy} ${finalSortOrder}
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: {
                books: result.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBooks / limit),
                    totalBooks,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({
            success: false,
            message: 'Kitoblarni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Get book by ID
 */
export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        // UUID validation regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        const result = await query(
            `SELECT 
                b.*,
                a.name as author_name, a.bio as author_bio,
                l.name as language_name, l.code as language_code,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', c.id,
                            'name_uz', c.name_uz,
                            'name_ru', c.name_ru,
                            'name_en', c.name_en,
                            'slug', c.slug
                        )
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as categories
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             LEFT JOIN languages l ON b.language_id = l.id
             LEFT JOIN book_categories bc ON b.id = bc.book_id
             LEFT JOIN categories c ON bc.category_id = c.id
             WHERE b.id = $1 AND b.status = 'active'
             GROUP BY b.id, a.name, a.bio, l.name, l.code`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Increment view count
        await query(
            'UPDATE books SET view_count = view_count + 1 WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({
            success: false,
            message: 'Kitobni olishda xatolik yuz berdi'
        });
    }
};

/**
 * Get trending books (most views/downloads)
 */
export const getTrendingBooks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT 
                b.id, b.title, b.cover_image, b.rating_avg,
                a.name as author_name,
                (b.view_count * 0.3 + b.download_count * 0.7) as popularity_score
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             WHERE b.status = 'active'
             ORDER BY popularity_score DESC
             LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get trending books error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Get new arrivals
 */
export const getNewBooks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT 
                b.id, b.title, b.cover_image, b.rating_avg, b.created_at,
                a.name as author_name
             FROM books b
             LEFT JOIN authors a ON b.author_id = a.id
             WHERE b.status = 'active'
             ORDER BY b.created_at DESC
             LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get new books error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Download book
 */
export const downloadBook = async (req, res) => {
    const client = await getClient();

    try {
        const { id } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Get book info
        const bookResult = await client.query(
            'SELECT title, file_path, file_format FROM books WHERE id = $1 AND status = $2',
            [id, 'active']
        );

        if (bookResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        const book = bookResult.rows[0];

        // Log download
        await client.query(
            `INSERT INTO download_history (user_id, book_id, ip_address)
             VALUES ($1, $2, $3)`,
            [userId, id, req.ip]
        );

        // Increment download count
        await client.query(
            'UPDATE books SET download_count = download_count + 1 WHERE id = $1',
            [id]
        );

        // Log analytics event
        await client.query(
            `INSERT INTO analytics_events (event_type, user_id, book_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            ['download', userId, id, req.ip, req.get('user-agent')]
        );

        await client.query('COMMIT');

        // Send file
        const filePath = path.join(process.cwd(), book.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fayl topilmadi'
            });
        }

        const fileName = `${book.title}.${book.file_format}`;
        res.download(filePath, fileName);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Yuklab olishda xatolik yuz berdi'
        });
    } finally {
        client.release();
    }
};

/**
 * Add book to user library
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
 * Get user library
 */
export const getUserLibrary = async (req, res) => {
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
 * Add or update review
 */
export const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Baho 1-5 oraligʻida boʻlishi kerak' });
        }

        await query(
            `INSERT INTO reviews (user_id, book_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, book_id) 
             DO UPDATE SET rating = $3, comment = $4, updated_at = CURRENT_TIMESTAMP`,
            [userId, id, rating, comment]
        );

        res.json({ success: true, message: 'Sharh saqlandi' });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ success: false, message: 'Sharh qo\'shishda xatolik yuz berdi' });
    }
};

/**
 * Get reviews for a book
 */
export const getReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT r.*, u.full_name as user_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.book_id = $1 AND r.status = 'active'
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Get user bookmarks for a book
 */
export const getBookmarks = async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const userId = req.user.id;

        const result = await query(
            'SELECT * FROM bookmarks WHERE user_id = $1 AND book_id = $2 ORDER BY page_number ASC',
            [userId, bookId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Add a bookmark
 */
export const addBookmark = async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const { page_number, note } = req.body;
        const userId = req.user.id;

        const result = await query(
            'INSERT INTO bookmarks (user_id, book_id, page_number, note) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, bookId, page_number, note]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Delete a bookmark
 */
export const deleteBookmark = async (req, res) => {
    try {
        const { bookmarkId } = req.params;
        const userId = req.user.id;

        await query('DELETE FROM bookmarks WHERE id = $1 AND user_id = $2', [bookmarkId, userId]);
        res.json({ success: true, message: 'O\'chirildi' });
    } catch (error) {
        console.error('Delete bookmark error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Highlights
 */
export const getHighlights = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await query(
            'SELECT * FROM highlights WHERE book_id = $1 AND user_id = $2 ORDER BY created_at DESC',
            [id, userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get highlights error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

export const addHighlight = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { text, position_data, color } = req.body;

        const result = await query(
            'INSERT INTO highlights (book_id, user_id, text, position_data, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, userId, text, position_data, color || '#ffcf00']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Add highlight error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

export const deleteHighlight = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const userId = req.user.id;
        await query('DELETE FROM highlights WHERE id = $1 AND user_id = $2', [highlightId, userId]);
        res.json({ success: true, message: 'O\'chirildi' });
    } catch (error) {
        console.error('Delete highlight error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Personalized Recommendations
 */
export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const preferredCategories = await query(
            `SELECT DISTINCT category_id 
             FROM book_categories bc
             JOIN user_library ul ON bc.book_id = ul.book_id
             WHERE ul.user_id = $1`,
            [userId]
        );

        let result;
        if (preferredCategories.rows.length > 0) {
            const catIds = preferredCategories.rows.map(c => c.category_id);
            result = await query(
                `SELECT DISTINCT b.id, b.title, b.cover_image, b.rating_avg, a.name as author_name
                 FROM books b
                 LEFT JOIN authors a ON b.author_id = a.id
                 JOIN book_categories bc ON b.id = bc.book_id
                 WHERE bc.category_id = ANY($1) 
                 AND b.id NOT IN (SELECT book_id FROM user_library WHERE user_id = $2)
                 AND b.status = 'active'
                 ORDER BY b.rating_avg DESC, b.view_count DESC
                 LIMIT $3`,
                [catIds, userId, limit]
            );
        } else {
            result = await query(
                `SELECT b.id, b.title, b.cover_image, b.rating_avg, a.name as author_name
                 FROM books b
                 LEFT JOIN authors a ON b.author_id = a.id
                 WHERE b.status = 'active'
                 ORDER BY b.rating_avg DESC, b.view_count DESC
                 LIMIT $1`,
                [limit]
            );
        }

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Get all categories
 */
export const getCategories = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                c.id, c.name_uz, c.name_ru, c.name_en, c.slug,
                COUNT(bc.book_id)::int as book_count
            FROM categories c
            LEFT JOIN book_categories bc ON c.id = bc.category_id
            GROUP BY c.id
            ORDER BY book_count DESC, c.name_uz ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriyalarni olishda xatolik'
        });
    }
};

export default {
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
};
