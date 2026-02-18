import pg from 'pg';
import dotenv from 'dotenv';
import { mockData } from './mockData.js';

dotenv.config();

const { Pool } = pg;

// Flag to force mock DB - Set to false for production
const USE_MOCK_DB = true;
let isMock = USE_MOCK_DB;

let pool;

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
    });

    pool.on('connect', () => {
        console.log('✅ DB: Connected to PostgreSQL');
    });

    pool.on('error', (err) => {
        console.error('❌ DB: Pool Error:', err.message);
    });
}

// Mock Query Handler
const handleMockQuery = (text, params = []) => {
    const query = (text || '').trim().toUpperCase();

    // 9. Get User (Login/Auth)
    if (query.includes('FROM USERS U') && query.includes('WHERE U.EMAIL = $1')) {
        return {
            rows: [{
                id: 1,
                email: params[0],
                password_hash: '$2y$10$YourMockHashHere',
                full_name: 'Mock Admin',
                status: 'active',
                email_verified: true,
                role: 'admin'
            }]
        };
    }

    return { rows: [] };
};

export const query = async (text, params) => {
    if (isMock) return handleMockQuery(text, params);
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        console.log(`[DB] Query executed in ${Date.now() - start}ms`);
        return res;
    } catch (error) {
        console.error('❌ DB: Query Error:', error.message);
        throw error;
    }
};

export const getClient = async () => {
    if (isMock) {
        return {
            query: async (text, params) => handleMockQuery(text, params),
            release: () => { },
        };
    }
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    client.query = (...args) => originalQuery(...args);
    client.release = () => originalRelease();

    return client;
};

// Also export as default for components using default import
export default { query, getClient };
