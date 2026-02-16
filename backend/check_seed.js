
import pool, { query } from './config/database.js';

async function checkAndSeed() {
    try {
        console.log('Checking database seeds...');

        // Check Languages
        const langResult = await query('SELECT COUNT(*) FROM languages');
        const langCount = parseInt(langResult.rows[0].count);
        console.log(`Languages count: ${langCount}`);

        if (langCount === 0) {
            console.log('Seeding languages...');
            await query(`
                INSERT INTO languages (code, name) VALUES
                ('uz', 'O''zbek'),
                ('ru', 'Русский'),
                ('en', 'English')
            `);
            console.log('Languages seeded.');
        }

        // Check Authors
        const authorResult = await query('SELECT COUNT(*) FROM authors');
        const authorCount = parseInt(authorResult.rows[0].count);
        console.log(`Authors count: ${authorCount}`);

        if (authorCount === 0) {
            console.log('Authors table empty. Seeding default authors...');
            await query(`
                INSERT INTO authors (name, bio) VALUES
                ('Abdulla Qodiriy', 'O''zbek romanchiligi asoschisi'),
                ('Cho''lpon', 'O''zbek yangi she''riyati asoschilaridan biri'),
                ('Oybek', 'Taniqli o''zbek yozuvchisi va shoiri'),
                ('G''afur G''ulom', 'O''zbek sovet adabiyoti klassigi')
            `);
            console.log('Default authors seeded (IDs 1-4).');
        } else {
            console.log('Authors already exist.');
            const authors = await query('SELECT id, name FROM authors');
            console.log('Existing Authors:', authors.rows);
        }

        const languages = await query('SELECT id, code, name FROM languages');
        console.log('Existing Languages:', languages.rows);

        console.log('Database check complete.');
    } catch (error) {
        console.error('Database check error:', error);
    } finally {
        // End pool to exit script
        await pool.end();
    }
}

checkAndSeed();
