import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { statsAPI } from '../services/api';
import './Achievements.css';

const Achievements = () => {
    const { t } = useTranslation();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const response = await statsAPI.getAchievements();
            setAchievements(response.data.data);
        } catch (err) {
            console.error('Fetch achievements error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (key) => {
        switch (key) {
            case 'first_session': return '🌱';
            case 'night_owl': return '🦉';
            case 'marathon': return '🏃';
            case 'scholar': return '🎓';
            default: return '🏆';
        }
    };

    if (loading) return <div className="achievements-loading">Yuklanmoqda...</div>;

    return (
        <div className="achievements-card glass card">
            <div className="achievements-header">
                <h3>{t('achievements.title')}</h3>
                <span className="badge-count">{t('achievements.count_suffix', { count: achievements.length })}</span>
            </div>

            <div className="achievements-list">
                {achievements.length > 0 ? (
                    achievements.map((achievement, index) => (
                        <div key={index} className="achievement-badge" title={achievement.achievement_name}>
                            <div className="badge-icon">
                                {achievement.icon || '🏆'}
                                <div className="badge-glow"></div>
                            </div>
                            <div className="badge-info">
                                <span className="badge-name">{achievement.achievement_name}</span>
                                <span className="badge-date">{new Date(achievement.earned_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="achievements-empty">
                        <p>{t('achievements.no_achievements')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Achievements;
