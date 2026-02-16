
import { query, getClient } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugAuthors() {
    try {
        console.log('Checking authors...');
        const result = await query('SELECT * FROM authors');
        console.table(result.rows);

        console.log('Checking languages...');
        const langResult = await query('SELECT * FROM languages');
        console.table(langResult.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

debugAuthors();
