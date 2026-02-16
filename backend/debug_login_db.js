import pg from 'pg';
import dotenv from 'dotenv';

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

async function checkUser() {
    const client = new Client(config);
    try {
        await client.connect();
        const email = 'admin@webkutubxona.uz';
        const res = await client.query(
            `SELECT u.email, u.status, u.email_verified, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email]
        );

        if (res.rows.length === 0) {
            console.log(`❌ User with email ${email} not found in database.`);

            // Check if user exists without join
            const res2 = await client.query("SELECT email, role_id FROM users WHERE email = $1", [email]);
            if (res2.rows.length > 0) {
                console.log(`⚠️ User exists but JOIN with roles failed. role_id: ${res2.rows[0].role_id}`);
                const roles = await client.query("SELECT * FROM roles");
                console.log("Available roles:", roles.rows);
            }
        } else {
            console.log("✅ User found:", res.rows[0]);
        }

        await client.end();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkUser();
