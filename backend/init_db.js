import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const { Client } = pg;

const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres',
    };

async function initDB() {
    console.log('Connecting to PostgreSQL...');

    // If using DATABASE_URL, we usually connect directly to the target DB
    if (process.env.DATABASE_URL) {
        console.log('Using DATABASE_URL path...');
        const client = new Client(config);
        try {
            await client.connect();
            const schemaPath = path.resolve(__dirname, '../database/schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                console.log('Executing schema...');
                await client.query(schemaSql);
                console.log('✅ Schema executed successfully.');
            }
            await client.end();
        } catch (err) {
            console.error('Error:', err);
            process.exit(1);
        }
        return;
    }

    const client = new Client(config);
    try {
        await client.connect();
        const targetDbName = process.env.DB_NAME || 'web_kutubxona';
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDbName}'`);
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE "${targetDbName}"`);
        }
        await client.end();

        const dbClient = new Client({ ...config, database: targetDbName });
        await dbClient.connect();
        const schemaPath = path.resolve(__dirname, '../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await dbClient.query(schemaSql);
            console.log('✅ Database initialization complete.');
        }
        await dbClient.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

initDB();
