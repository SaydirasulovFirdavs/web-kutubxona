import { query } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function findBook() {
    try {
        const idPrefix = 'f1ebba58-fa8e-4487-bdac-a0b1ccaf1c7';
        console.log(`Searching for book ID starting with: ${idPrefix}...`);

        // Since id is UUID, we need to cast to text for ILIKE or use a regex
        const result = await query("SELECT id, title FROM books WHERE id::text LIKE $1", [`${idPrefix}%`]);

        if (result.rows.length === 0) {
            console.log('No books found with that prefix. Listing first 10 books:');
            const allBooks = await query("SELECT id, title FROM books LIMIT 10");
            console.log(JSON.stringify(allBooks.rows, null, 2));
        } else {
            console.log('Book(s) found:');
            console.log(JSON.stringify(result.rows, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

findBook();
