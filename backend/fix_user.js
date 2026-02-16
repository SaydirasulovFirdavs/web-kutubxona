import { query } from './config/database.js';

const fixUser = async () => {
    try {
        console.log('Fixing user status...');
        const res = await query(
            "UPDATE users SET status = 'active', email_verified = true WHERE email = 'otaqulov2222@gmail.com'"
        );
        console.log('Update result:', res.rowCount);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixUser();
