import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

import fs from 'fs';

// ... (previous imports and config)

// ...
async function checkImages() {
    try {
        const userRes = await pool.query("SELECT id FROM users WHERE email = 'saydirasulovfirdavs040507@gmail.com'");
        if (userRes.rows.length === 0) {
            console.log('User not found');
            return;
        }
        const userId = userRes.rows[0].id;

        const res = await pool.query(`
            SELECT b.title, b.cover_image 
            FROM download_history dh
            JOIN books b ON dh.book_id = b.id
            WHERE dh.user_id = $1
            LIMIT 5
        `, [userId]);

        console.log('User History Images:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        // ...
        // ...
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkImages();
