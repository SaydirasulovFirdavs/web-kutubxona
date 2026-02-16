import { query } from '../config/database.js';

/**
 * Start a reading session
 */
export const startSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: bookId } = req.params;

        const result = await query(
            'INSERT INTO reading_sessions (user_id, book_id, start_time) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
            [userId, bookId]
        );

        res.json({ success: true, data: { sessionId: result.rows[0].id } });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * End a reading session and update streaks
 */
export const endSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.body;

        // End the session
        const sessionResult = await query(
            `UPDATE reading_sessions 
             SET end_time = CURRENT_TIMESTAMP, 
                 duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))/60
             WHERE id = $1 AND user_id = $2 AND end_time IS NULL
             RETURNING duration_minutes, start_time`,
            [sessionId, userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Seans topilmadi' });
        }

        const duration = sessionResult.rows[0].duration_minutes;

        // Update user stats (total reading time)
        await query(
            'UPDATE user_streaks SET total_reading_minutes = total_reading_minutes + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [Math.round(duration), userId]
        );

        // Streak Calculation Logic
        // A streak increments if the user reads for at least 5 minutes on a new day.
        if (duration >= 5) {
            const streakRes = await query(
                'SELECT last_activity_date, current_streak, longest_streak FROM user_streaks WHERE user_id = $1',
                [userId]
            );

            const { last_activity_date, current_streak, longest_streak } = streakRes.rows[0];
            const today = new Date().toISOString().split('T')[0];
            const lastDate = last_activity_date ? new Date(last_activity_date).toISOString().split('T')[0] : null;

            let newStreak = current_streak;
            let updateLastDate = false;

            if (!lastDate) {
                newStreak = 1;
                updateLastDate = true;
            } else {
                const diffDays = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Incremented streak
                    newStreak += 1;
                    updateLastDate = true;
                } else if (diffDays > 1) {
                    // Streak broken
                    newStreak = 1;
                    updateLastDate = true;
                }
                // If diffDays === 0, user already read today, streak unchanged
            }

            if (updateLastDate) {
                const newLongest = Math.max(newStreak, longest_streak);
                await query(
                    'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, last_activity_date = $3 WHERE user_id = $4',
                    [newStreak, newLongest, today, userId]
                );
            }
        }

        // --- ACHIEVEMENT ENGINE ---
        try {
            await checkAchievements(userId);
        } catch (err) {
            console.error('Achievement check failed:', err);
        }

        res.json({ success: true, message: 'Seans yakunlandi' });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Achievement Checking Logic
 */
async function checkAchievements(userId) {
    // 1. Get all potential achievements not yet earned
    const unearned = await query(`
        SELECT * FROM achievements 
        WHERE id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)
    `, [userId]);

    if (unearned.rows.length === 0) return;

    // 2. Get user stats for evaluation
    const statsRes = await query(`
        SELECT 
            (SELECT COUNT(*) FROM reading_sessions WHERE user_id = $1) as total_sessions,
            (SELECT COUNT(*) FROM reading_sessions WHERE user_id = $1 AND EXTRACT(HOUR FROM start_time) >= 22 OR EXTRACT(HOUR FROM start_time) < 5) as night_sessions,
            (SELECT COALESCE(MAX(duration_minutes), 0) FROM reading_sessions WHERE user_id = $1 AND start_time::date = CURRENT_DATE) as max_daily_minutes,
            (SELECT total_books_read FROM user_streaks WHERE user_id = $1) as total_books
        FROM users WHERE id = $1
    `, [userId]);

    if (statsRes.rows.length === 0) return;
    const stats = statsRes.rows[0];

    // 3. Evaluate each unearned achievement
    for (const ach of unearned.rows) {
        let earned = false;

        switch (ach.requirement_type) {
            case 'total_sessions':
                if (parseInt(stats.total_sessions) >= ach.requirement_value) earned = true;
                break;
            case 'night_sessions':
                if (parseInt(stats.night_sessions) >= ach.requirement_value) earned = true;
                break;
            case 'daily_minutes':
                if (parseFloat(stats.max_daily_minutes) >= ach.requirement_value) earned = true;
                break;
            case 'total_books':
                if (parseInt(stats.total_books) >= ach.requirement_value) earned = true;
                break;
        }

        if (earned) {
            await query(
                'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, ach.id]
            );
            console.log(`🏆 Achievement earned: ${ach.name} for User ${userId}`);
        }
    }
}

/**
 * Get user's earned achievements
 */
export const getMyAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(`
            SELECT a.*, ua.earned_at 
            FROM achievements a
            INNER JOIN user_achievements ua ON a.id = ua.achievement_id
            WHERE ua.user_id = $1
            ORDER BY ua.earned_at DESC
        `, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * Get user reading statistics
 */
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(
            `SELECT current_streak, longest_streak, total_reading_minutes, total_books_read, last_activity_date 
             FROM user_streaks WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Initialize if missing
            await query('INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
            return res.json({
                success: true,
                data: { current_streak: 0, longest_streak: 0, total_reading_minutes: 0, total_books_read: 0 }
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
    }
};

/**
 * AI Reading Buddy Proxy
 */
export const aiExplain = async (req, res) => {
    try {
        const { text, context } = req.body;

        // Simulating AI behavior for now. 
        // In a real scenario, this would call OpenAI/Gemini/Anthropic API.
        const response = `Bu matn: "${text}" haqidagi tushuntirish: 
        Loyiha doirasida ushbu so'z/jumla "${context || 'umumiy'}" kontekstida ishlatilgan. 
        Asosan, bu kitobning mazmunini chuqurroq anglashga yordam beradi.`;

        // Let's add a 1s delay to simulate API call
        setTimeout(() => {
            res.json({ success: true, data: response });
        }, 1000);
    } catch (error) {
        console.error('AI Explain error:', error);
        res.status(500).json({ success: false, message: 'AI xizmatida xatolik' });
    }
};
