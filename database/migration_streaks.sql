-- Add Highlights support
CREATE TABLE IF NOT EXISTS highlights (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position_data JSONB, -- Stores PDF page, coordinates, etc.
    color VARCHAR(20) DEFAULT '#ffcf00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add User Streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_books_read INTEGER DEFAULT 0,
    total_reading_minutes INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Reading Sessions (to calculate streaks and duration)
CREATE TABLE IF NOT EXISTS reading_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize streaks for existing users
INSERT INTO user_streaks (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
