
import { query } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixSlashes() {
    try {
        console.log('Normalizing backslashes in file_path...');
        await query("UPDATE books SET file_path = REPLACE(file_path, '\\', '/')");
        console.log('Slash normalization complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

fixSlashes();
