
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
};

async function checkDB() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected to postgres DB.');

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'web_kutubxona'");
        console.log('Query result row count:', res.rowCount);

        if (res.rowCount > 0) {
            console.log('web_kutubxona exists.');
            // Try connecting to it
            await client.end();
            const dbClient = new Client({ ...config, database: 'web_kutubxona' });
            await dbClient.connect();
            console.log('Connected to web_kutubxona successfully.');
            await dbClient.end();
        } else {
            console.log('web_kutubxona does not exist.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        try { await client.end(); } catch (e) { }
    }
}

checkDB();
