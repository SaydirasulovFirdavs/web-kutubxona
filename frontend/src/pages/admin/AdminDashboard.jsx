import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import './Admin.css';

function AdminDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAnalytics();
            setStats(response.data.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                {error}
                <button onClick={fetchAnalytics} className="btn btn-sm btn-outline">
                    Qayta urinish
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1 className="admin-title">{t('admin.dashboard')}</h1>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.total_books || 0}</h3>
                        <p>{t('admin.total_books')}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.total_users || 0}</h3>
                        <p>{t('admin.total_users')}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💾</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.total_downloads || 0}</h3>
                        <p>{t('admin.total_downloads')}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-info">
                        <h3>{stats?.stats?.new_users_month || 0}</h3>
                        <p>{t('admin.new_users_month')}</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-section">
                <h2>{t('admin.recent_downloads')}</h2>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('admin.book')}</th>
                                <th>{t('admin.user')}</th>
                                <th>{t('admin.time')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_downloads?.length > 0 ? (
                                stats.recent_downloads.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.title}</td>
                                        <td>{log.full_name}</td>
                                        <td>
                                            {new Date(log.downloaded_at).toLocaleString('uz-UZ')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center' }}>
                                        {t('admin.no_data')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
