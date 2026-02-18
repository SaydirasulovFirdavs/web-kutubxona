import dotenv from 'dotenv';
dotenv.config();
import { query } from './config/database.js';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
    try {
        console.log('Creating super admin user...');

        // 1. Get role ID
        const roleRes = await query(`SELECT id FROM roles WHERE name = 'super_admin'`);
        if (roleRes.rows.length === 0) {
            console.error('super_admin role not found!');
            process.exit(1);
        }
        const roleId = roleRes.rows[0].id;

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const descriptionRaw = 'admin123';
        const passwordHash = await bcrypt.hash(descriptionRaw, salt);

        // 3. Insert user
        const res = await query(`
            INSERT INTO users (email, password_hash, full_name, role_id, status, email_verified)
            VALUES ($1, $2, $3, $4, 'active', true)
            ON CONFLICT (email) DO UPDATE 
            SET role_id = $4, status = 'active', email_verified = true
            RETURNING id, email;
        `, ['admin@webkutubxona.uz', passwordHash, 'Super Admin', roleId]);

        console.log('✅ Super Admin created successfully!');
        console.log('Email:', res.rows[0].email);
        console.log('Password:', descriptionRaw);

        process.exit(0);
    } catch (e) {
        console.error('Error creating admin:', e);
        process.exit(1);
    }
};

createAdmin();
