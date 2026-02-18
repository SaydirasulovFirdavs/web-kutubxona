import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'web_kutubxona',
};

async function debugLogin() {
    const client = new Client(config);

    try {
        await client.connect();

        const email = 'admin@webkutubxona.uz';
        const password = 'admin123';

        console.log(`Checking user: ${email}`);

        const res = await client.query(
            'SELECT id, email, password_hash, status, email_verified FROM users WHERE email = $1',
            [email]
        );

        if (res.rows.length === 0) {
            console.log('❌ User not found in DB!');
            return;
        }

        const user = res.rows[0];
        console.log('User found:', {
            id: user.id,
            email: user.email,
            status: user.status,
            email_verified: user.email_verified,
            hash_prefix: user.password_hash.substring(0, 10) + '...'
        });

        console.log(`Attempting to compare password: '${password}'`);
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password DOES NOT match!');
        }

        // Try hashing with 12 rounds (app default)
        const salt = await bcrypt.genSalt(12);
        const newHash = await bcrypt.hash(password, salt);
        console.log(`Generated new hash (cost 12): ${newHash.substring(0, 10)}...`);
        const isNewMatch = await bcrypt.compare(password, newHash);
        console.log(`New hash verification: ${isNewMatch}`);

    } catch (err) {
        console.error('Debug error:', err);
    } finally {
        await client.end();
    }
}

debugLogin();
