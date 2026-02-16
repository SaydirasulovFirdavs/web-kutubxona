
import { query } from './config/database.js';

const checkUser = async () => {
    try {
        const email = 'saydirasulovfirdavs040507@gmail.com';
        console.log(`Checking for user: ${email}`);
        const res = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('✅ User found:');
            console.table(res.rows);
        } else {
            console.log('❌ User not found.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error checking user:', e);
        process.exit(1);
    }
};

checkUser();
