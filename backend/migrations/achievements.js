import { query } from '../config/database.js';

const migrate = async () => {
    try {
        console.log('--- Starting Achievements Migration ---');

        await query(`DROP TABLE IF EXISTS user_achievements CASCADE;`);
        await query(`DROP TABLE IF EXISTS achievements CASCADE;`);

        await query(`
            CREATE TABLE achievements (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                icon_key VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                requirement_type VARCHAR(50) NOT NULL,
                requirement_value INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ achievements table created');

        await query(`
            CREATE TABLE user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                achievement_id INTEGER NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
                UNIQUE(user_id, achievement_id)
            );
        `);
        console.log('✅ user_achievements table created');

        await query(`
            INSERT INTO achievements (name, description, icon_key, category, requirement_type, requirement_value) VALUES
            ('Birinchi Qadam', 'Birinchi mutolaa seansini yakunlang', 'first_session', 'reading', 'total_sessions', 1),
            ('Tungi Boyqush', 'Kechasi (22:00 dan keyin) 3 marta o''qiganda', 'night_owl', 'timing', 'night_sessions', 3),
            ('Marafonchi', 'Bir kunda 60 daqiqadan ko''p o''qiganda', 'marathon', 'duration', 'daily_minutes', 60),
            ('Bilimdon', 'Jami 5 ta kitobni oxirigacha o''qiganda', 'scholar', 'books', 'total_books', 5)
            ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Seeded initial achievements');

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error detail:', error.message);
        process.exit(1);
    }
};

migrate();
