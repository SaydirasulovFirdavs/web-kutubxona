import dotenv from 'dotenv';
dotenv.config();
import { query } from './config/database.js';

const checkAdmin = async () => {
    try {
        console.log('Checking for admin users...');
        const res = await query(`
            SELECT u.id, u.email, u.full_name, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name IN ('admin', 'super_admin')
        `);

        if (res.rows.length > 0) {
            console.log('✅ Admin users found:');
            console.table(res.rows);
        } else {
            console.log('❌ No admin users found.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error checking admin:', e);
        process.exit(1);
    }
};

checkAdmin();
