import { useState, useEffect } from 'react';
import { statsAPI } from '../services/api';
import './StatsCard.css';

function StatsCard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await statsAPI.getMyStats();
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (err) {
                console.error('Fetch stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !stats) return null;

    return (
        <div className="stats-card-pro glass-card">
            <div className="stats-main">
                <div className="streak-badge">
                    <div className="streak-icon">🔥</div>
                    <div className="streak-info">
                        <span className="streak-count">{stats.current_streak}</span>
                        <span className="streak-label">Kunlik Streak</span>
                    </div>
                </div>

                <div className="stats-divider"></div>

                <div className="stats-details">
                    <div className="stat-item">
                        <span className="stat-value">{Math.round(stats.total_reading_minutes / 60)}s</span>
                        <span className="stat-desc">Mutolaa vaqti</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.longest_streak}</span>
                        <span className="stat-desc">Eng yaxshi natija</span>
                    </div>
                </div>
            </div>

            <div className="streak-progress">
                <div className="progress-label">
                    <span>Keyingi darajagacha</span>
                    <span>{stats.current_streak % 7}/7</span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${(stats.current_streak % 7 / 7) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default StatsCard;
