import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'web_kutubxona',
    };

export async function seedAdmin() {
    const client = new Client(config);

    try {
        await client.connect();

        // 1. Get Super Admin Role ID
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roleRes.rows.length === 0) {
            console.error("Role 'super_admin' not found. Please run schema.sql first.");
            return; // Don't crash, just skip
        }
        const superAdminRoleId = roleRes.rows[0].id;

        // 2. Hash Password
        const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert or Update Admin User
        const email = process.env.SUPER_ADMIN_EMAIL || 'admin@webkutubxona.uz';

        const checkUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);

        let userId;
        if (checkUser.rows.length > 0) {
            console.log('Admin user already exists. Updating password...');
            const res = await client.query(
                `UPDATE users SET password_hash = $1, role_id = $2, status = 'active', email_verified = true WHERE email = $3 RETURNING id`,
                [hashedPassword, superAdminRoleId, email]
            );
            userId = res.rows[0].id;
        } else {
            console.log('Creating new admin user...');
            const res = await client.query(
                `INSERT INTO users (email, password_hash, full_name, role_id, status, email_verified) 
                 VALUES ($1, $2, $3, $4, 'active', true) RETURNING id`,
                [email, hashedPassword, 'Super Admin', superAdminRoleId]
            );
            userId = res.rows[0].id;
        }

        console.log(`✅ Admin user seeded successfully. Email: ${email}`);

        // 4. Run additional test data if exists
        const testDataPath = path.resolve(__dirname, '../database/test_data.sql');
        if (fs.existsSync(testDataPath)) {
            console.log('Running test_data.sql...');
            let testSql = fs.readFileSync(testDataPath, 'utf8');
            await client.query(testSql);
            console.log('Test data executed.');
        }

    } catch (err) {
        console.error('Error seeding admin:', err);
        // Throwing error back to startup.js
        throw err;
    } finally {
        await client.end();
    }
}
