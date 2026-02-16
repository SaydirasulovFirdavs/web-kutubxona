
import { query, getClient } from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixSpaces() {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        console.log('Finding books with trailing spaces in file_path...');
        const result = await client.query("SELECT id, file_path FROM books WHERE file_path LIKE '% '");

        console.log(`Found ${result.rows.length} books to fix.`);

        for (const book of result.rows) {
            const oldPath = book.file_path;
            const newPath = oldPath.trim();

            // 1. Fix Database
            await client.query("UPDATE books SET file_path = $1 WHERE id = $2", [newPath, book.id]);

            // 2. Fix File System
            const absoluteOldPath = path.join(process.cwd(), oldPath);
            const absoluteNewPath = path.join(process.cwd(), newPath);

            // Determine if file exists at old path (with space)
            if (fs.existsSync(absoluteOldPath)) {
                console.log(`Renaming: "${oldPath}" -> "${newPath}"`);
                fs.renameSync(absoluteOldPath, absoluteNewPath);
            } else {
                // Maybe it is stored without space on disk but DB has space? 
                // Or maybe absolute path logic is tricky with relative ./
                // Try stripping ./ for fs check if needed, but process.cwd() should handle it if consistent.

                // If allow for ./ prefix
                const cleanOld = oldPath.startsWith('./') ? oldPath.substring(2) : oldPath;
                const pathForFs = path.join(process.cwd(), cleanOld);

                if (fs.existsSync(pathForFs)) {
                    const cleanNew = newPath.startsWith('./') ? newPath.substring(2) : newPath;
                    const newPathForFs = path.join(process.cwd(), cleanNew);
                    console.log(`Renaming (clean): "${cleanOld}" -> "${cleanNew}"`);
                    fs.renameSync(pathForFs, newPathForFs);
                } else {
                    console.log(`File not found for renaming: ${oldPath}`);
                }
            }
        }

        await client.query('COMMIT');
        console.log('Fix complete.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

fixSpaces();
