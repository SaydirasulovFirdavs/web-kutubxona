import { query } from '../config/database.js';

const inspect = async () => {
    try {
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.log('--- Columns of users ---');
        result.rows.forEach(r => {
            console.log(`${r.column_name}: ${r.data_type}`);
        });

        const constraints = await query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'users'
        `);
        console.log('--- Constraints of users ---');
        constraints.rows.forEach(c => {
            console.log(`${c.constraint_name}: ${c.constraint_type}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
};

inspect();
