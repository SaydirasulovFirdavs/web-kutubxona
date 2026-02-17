import { initDB } from './init_db.js';
import { seedAdmin } from './seed_admin.js';
import app from './server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startup() {
    console.log('🚀 Starting Web Kutubxona Resilient Bootloader...');

    // 1. Start Express IMMEDIATELY to satisfy Railway health checks
    const server = app.listen(PORT, () => {
        console.log(`✅ Express is listening on port ${PORT}. Ready for health checks.`);
    });

    try {
        // 2. Initialize Database in background
        console.log('⏳ Initializing Database...');
        await initDB();
        console.log('✅ Database Schema Ready.');

        // 3. Seed Admin
        console.log('⏳ Seeding Admin User...');
        await seedAdmin();
        console.log('✅ Admin Seeding Complete.');

    } catch (err) {
        console.error('⚠️ Startup Warning: Database initialization failed.');
        console.error(err);
        console.log('ℹ️ The server will remain running, but some features may be limited.');
    }
}

startup();
