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

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default db first
};

async function initDB() {
    console.log('Connecting to PostgreSQL...');
    const client = new Client(config);

    try {
        await client.connect();

        const targetDbName = process.env.DB_NAME || 'web_kutubxona';

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDbName}'`);

        if (res.rowCount === 0) {
            console.log(`Database ${targetDbName} does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${targetDbName}"`);
            console.log(`Database ${targetDbName} created successfully.`);
        } else {
            console.log(`Database ${targetDbName} already exists.`);
        }

        await client.end();

        // Connect to the new database
        console.log(`Connecting to ${targetDbName}...`);
        const dbClient = new Client({
            ...config,
            database: targetDbName
        });

        await dbClient.connect();

        // Read schema file
        const schemaPath = path.resolve(__dirname, '../database/schema.sql');
        console.log(`Reading schema from ${schemaPath}...`);

        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            console.log('Executing schema...');
            await dbClient.query(schemaSql);
            console.log('Schema executed successfully.');
        } else {
            console.error(`Schema file not found at ${schemaPath}`);
        }

        await dbClient.end();
        console.log('Database initialization complete.');

    } catch (err) {
        console.error('Error initializing database:', err);
        try { await client.end(); } catch (e) { }
        process.exit(1);
    }
}

initDB();
