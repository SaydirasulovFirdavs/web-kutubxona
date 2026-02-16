
import { query } from './config/database.js';

async function check() {
    try {
        const res = await query('SELECT id, title, cover_image, is_featured, created_at FROM books WHERE title ILIKE $1', ['%tkan kunlar%']);
        console.log('BOOKS FOUND:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Check error:', e);
    } finally {
        process.exit();
    }
}
check();
