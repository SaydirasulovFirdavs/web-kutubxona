
import { query } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugBook() {
    try {
        console.log('Fetching book file info for "Ikki eshik orasida"...');
        const result = await query("SELECT id, title, file_path FROM books WHERE title ILIKE '%Ikki eshik%' LIMIT 1");
        if (result.rows.length === 0) {
            console.log('No books found.');
        } else {
            console.log('Book found:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

debugBook();
