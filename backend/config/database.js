import pg from 'pg';
import dotenv from 'dotenv';
import { mockData } from './mockData.js';

dotenv.config();

const { Pool } = pg;

// Flag to force mock DB
const USE_MOCK_DB = false; // Forced for now as per user request

let pool;
let isMock = USE_MOCK_DB;

if (!USE_MOCK_DB) {
    const config = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'web_kutubxona',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
        };

    pool = new Pool({
        ...config,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000,
    });

    pool.on('connect', () => {
        console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
        console.error('❌ Database error:', err);
        // Fallback to mock not implemented for runtime errors, only initial connection
    });
} else {
    console.log('⚠️  RUNNING IN MOCK DATABASE MODE');
}

// Mock Query Handler
const handleMockQuery = (text, params) => {
    const query = text.trim().toUpperCase();

    // Helper to simulate DB delay
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));

    // 1. SELECT COUNT(*) FROM books
    if (query.includes('SELECT COUNT(*) FROM BOOKS')) {
        return { rows: [{ count: mockData.books.length }] };
    }

    // 2. SELECT ... FROM books (Get All)
    if (query.startsWith('SELECT') && query.includes('FROM BOOKS') && !query.includes('WHERE B.ID = $1')) {
        let books = [...mockData.books];

        // Mock Search
        const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%'));
        if (searchParam) {
            const searchTerm = searchParam.replace(/%/g, '').toLowerCase();
            books = books.filter(b =>
                b.title.toLowerCase().includes(searchTerm) ||
                mockData.authors.find(a => a.id === b.author_id)?.name.toLowerCase().includes(searchTerm)
            );
        }

        // Mock Category Filter
        if (query.includes('FROM BOOK_CATEGORIES')) {
            // Find the category ID in params (it will be a number string or number)
            // In the controller, we push(category) which is usually a string from req.query
            // We need to be careful not to mistake limit/offset for category ID.
            // But usually limit/offset are at the end.
            // Let's assume the param that matches a category ID is the one.
            const categoryId = params.find(p => {
                const id = parseInt(p);
                return !isNaN(id) && mockData.categories.some(c => c.id === id) && id < 100; // simplistic check, categories are small IDs
            });

            if (categoryId) {
                const catId = parseInt(categoryId);
                const bookIdsInCategory = mockData.book_categories
                    .filter(bc => bc.category_id === catId)
                    .map(bc => bc.book_id);

                books = books.filter(b => bookIdsInCategory.includes(b.id));
            }
        }

        // Implement sorting/filtering if needed, but for "fake db run" just returning all is fine
        // Apply limit/offset if typical
        const limitIndex = params.findIndex(p => typeof p === 'number' && p > 0 && p < 1000); // basic guess for limit
        if (limitIndex !== -1) {
            // Basic pagination mock
            // For now, let's just return all matched books to avoid complex mock pagination logic errors
            // or just slice if needed.
            return { rows: books };
        }
        return { rows: books };
    }

    // 3. SELECT ... FROM books WHERE id = $1 (Get One)
    if (query.includes('FROM BOOKS') && query.includes('WHERE B.ID = $1')) {
        const bookId = parseInt(params[0]);
        const book = mockData.books.find(b => b.id === bookId);

        if (!book) return { rows: [] };

        // Mock joins
        const author = mockData.authors.find(a => a.id === book.author_id) || {};
        const language = mockData.languages.find(l => l.id === book.language_id) || {};
        const categories = mockData.book_categories
            .filter(bc => bc.book_id === bookId)
            .map(bc => mockData.categories.find(c => c.id === bc.category_id))
            .filter(Boolean);

        return {
            rows: [{
                ...book,
                author_name: author.name,
                author_bio: author.bio,
                language_name: language.name,
                language_code: language.code,
                categories: categories
            }]
        };
    }

    // 4. Download / View count updates
    if (query.startsWith('UPDATE BOOKS SET')) {
        return { rowCount: 1 };
    }

    // 5. Insert history
    if (query.startsWith('INSERT INTO')) {
        return { rowCount: 1 };
    }

    // 6. Get Categories (for Add Book form)
    if (query.includes('SELECT * FROM CATEGORIES') || query.includes('SELECT ID, NAME_UZ')) {
        return { rows: mockData.categories };
    }

    // 7. Get Authors
    if (query.includes('SELECT * FROM AUTHORS')) {
        return { rows: mockData.authors };
    }

    // 8. Get Languages
    if (query.includes('SELECT * FROM LANGUAGES')) {
        return { rows: mockData.languages };
    }

    console.warn('⚠️  Unmocked query:', text);
    return { rows: [] };
};

// Helper function for queries
export const query = async (text, params) => {
    if (isMock) {
        return handleMockQuery(text, params);
    }

    // Real DB implementation
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function for transactions
export const getClient = async () => {
    if (isMock) {
        // Return a mock client
        return {
            query: async (text, params) => handleMockQuery(text, params),
            release: () => { },
            lastQuery: null
        };
    }

    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    client.query = (...args) => {
        client.lastQuery = args;
        return query(...args);
    };

    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release();
    };

    return client;
};

export default { query, getClient };
