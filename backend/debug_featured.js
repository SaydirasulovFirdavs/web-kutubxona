
import { query } from './config/database.js';

async function check() {
    try {
        const res = await query('SELECT id, title, cover_image, is_featured FROM books WHERE is_featured = true');
        console.log('FEATURED BOOKS:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Check error:', e);
    } finally {
        process.exit();
    }
}
check();
