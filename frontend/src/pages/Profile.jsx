import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import './Profile.css';

function Profile() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'security'

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [library, setLibrary] = useState([]);
    const [downloads, setDownloads] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchLibrary();
        fetchHistory();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            const userData = response.data.data;
            setFormData(prev => ({
                ...prev,
                full_name: userData.full_name,
                email: userData.email,
                role: userData.role_id === 2 ? t('profile_page.roles.admin') : userData.role_id === 3 ? t('profile_page.roles.super_admin') : t('profile_page.roles.user')
            }));
        } catch (err) {
            console.error(err);
            setError(t('profile_page.alerts.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchLibrary = async () => {
        try {
            const response = await userAPI.getLibrary();
            setLibrary(response.data.data);
        } catch (err) {
            console.error("Library fetch error:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await userAPI.getHistory();
            setDownloads(response.data.data);
        } catch (err) {
            console.error("History fetch error:", err);
        }
    };

    const handleRemoveFromLibrary = async (e, bookId) => {
        e.stopPropagation();
        if (!window.confirm(t('profile_page.alerts.confirm_remove_library'))) return;

        try {
            await userAPI.removeFromLibrary(bookId);
            setLibrary(prev => prev.filter(book => book.id !== bookId));
            setSuccess(t('profile_page.alerts.remove_success_library'));
        } catch (err) {
            console.error(err);
            setError(t('common.error'));
        }
    };

    const handleRemoveFromHistory = async (e, historyId) => {
        e.stopPropagation();
        if (!window.confirm(t('profile_page.alerts.confirm_remove_history'))) return;

        try {
            await userAPI.removeHistory(historyId);
            setDownloads(prev => prev.filter(item => item.history_id !== historyId));
            setSuccess(t('profile_page.alerts.remove_success_history'));
        } catch (err) {
            console.error(err);
            setError(t('common.error'));
        }
    };



    // Handle image load error
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "/placeholder-book.svg";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        if (formData.new_password) {
            if (!formData.current_password) {
                setError(t('profile_page.alerts.pwd_current_required'));
                setSaving(false);
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                setError(t('profile_page.alerts.pwd_mismatch'));
                setSaving(false);
                return;
            }
            if (formData.new_password.length < 6) {
                setError(t('profile_page.alerts.pwd_min_length'));
                setSaving(false);
                return;
            }
        }

        try {
            const updateData = {
                full_name: formData.full_name
            };

            if (formData.new_password) {
                updateData.current_password = formData.current_password;
                updateData.new_password = formData.new_password;
            }

            const response = await userAPI.updateProfile(updateData);
            setSuccess(response.data.message || t('profile_page.success_msg'));

            setUser(prev => ({
                ...prev,
                full_name: formData.full_name
            }));

            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };
    // Get role color
    const getRoleColor = (role) => {
        // Use normalized role check or just colors by string if they are translated
        // It's safer to use the untranslated role or ID, but here they are set after fetch.
        return '#3b82f6';
    };

    if (loading) {
        return (
            <div className="profile-page-pro">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-pro">
            <div className="profile-container">
                {/* Left Side - Profile Card */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {getInitials(formData.full_name)}
                        </div>
                        <h2 className="profile-name">{formData.full_name}</h2>
                        <span
                            className="profile-role-badge"
                            style={{ backgroundColor: getRoleColor(formData.role) }}
                        >
                            {formData.role}
                        </span>
                        <p className="profile-email">{formData.email}</p>
                    </div>

                    <div className="profile-stats">
                        <div
                            className={`stat-item ${activeTab === 'library' ? 'active' : ''}`}
                            onClick={() => setActiveTab('library')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            <span>{t('profile_page.tabs.library')}: <strong>{library.length}</strong></span>
                        </div>
                        <div
                            className={`stat-item ${activeTab === 'downloads' ? 'active' : ''}`}
                            onClick={() => setActiveTab('downloads')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>{t('profile_page.tabs.downloads')}: <strong>{downloads.length}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Settings Form */}
                <div className="profile-content">
                    {/* Tabs */}
                    <div className="profile-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {t('profile_page.tabs.info')}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            {t('profile_page.tabs.security')}
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="alert-pro alert-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="alert-pro alert-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {success}
                        </div>
                    )}

                    {activeTab === 'library' && (
                        <div className="book-list-container">
                            <h3 className="section-title">{t('profile_page.titles.saved_books')}</h3>
                            {library.length > 0 ? (
                                <div className="profile-book-grid">
                                    {library.map(book => (
                                        <div key={book.id} className="profile-book-card">
                                            <div className="profile-book-cover">
                                                <img
                                                    src={getImageUrl(book.cover_image)}
                                                    alt={book.title}
                                                    onError={handleImageError}
                                                />
                                                <button
                                                    className="delete-book-btn"
                                                    onClick={(e) => handleRemoveFromLibrary(e, book.id)}
                                                    title={t('admin.table_actions')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="profile-book-info">
                                                <h4>{book.title}</h4>
                                                <p>{book.author_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-message">{t('profile_page.messages.no_saved')}</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'downloads' && (
                        <div className="book-list-container">
                            <h3 className="section-title">{t('profile_page.titles.downloaded_books')}</h3>
                            {downloads.length > 0 ? (
                                <div className="profile-book-grid">
                                    {downloads.map(book => (
                                        <div key={book.history_id} className="profile-book-card">
                                            <div className="profile-book-cover">
                                                <img
                                                    src={getImageUrl(book.cover_image)}
                                                    alt={book.title}
                                                    onError={handleImageError}
                                                />
                                                <button
                                                    className="delete-book-btn"
                                                    onClick={(e) => handleRemoveFromHistory(e, book.history_id)}
                                                    title={t('admin.table_actions')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="profile-book-info">
                                                <h4>{book.title}</h4>
                                                <p>{book.author_name}</p>
                                                <span className="download-date">{new Date(book.downloaded_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-message">{t('profile_page.messages.no_downloaded')}</p>
                            )}
                        </div>
                    )}

                    {(activeTab === 'info' || activeTab === 'security') && (
                        <form onSubmit={handleSubmit}>
                            {activeTab === 'info' && (
                                <div className="form-section">
                                    <h3 className="section-title">{t('profile_page.tabs.info')}</h3>

                                    <div className="form-group-pro">
                                        <label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            {t('profile_page.full_name')}
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="input-pro"
                                            placeholder={t('profile_page.placeholders.name')}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-pro">
                                        <label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                            {t('profile_page.email')}
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            className="input-pro disabled"
                                            disabled
                                        />
                                        <span className="input-hint">{t('profile_page.hints.email_change')}</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="form-section">
                                    <h3 className="section-title">{t('profile_page.password')}</h3>
                                    <p className="section-desc">{t('auth.forgot_password_desc', { defaultValue: 'Hisobingizni himoya qilish uchun kuchli parol tanlang' })}</p>

                                    <div className="form-group-pro">
                                        <label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                            {t('profile_page.placeholders.current_password')}
                                        </label>
                                        <input
                                            type="password"
                                            name="current_password"
                                            value={formData.current_password}
                                            onChange={handleChange}
                                            className="input-pro"
                                            placeholder={t('profile_page.placeholders.current_password')}
                                        />
                                    </div>

                                    <div className="form-row-pro">
                                        <div className="form-group-pro">
                                            <label>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                </svg>
                                                {t('profile_page.placeholders.new_password')}
                                            </label>
                                            <input
                                                type="password"
                                                name="new_password"
                                                value={formData.new_password}
                                                onChange={handleChange}
                                                className="input-pro"
                                                placeholder={t('profile_page.placeholders.new_password')}
                                            />
                                        </div>
                                        <div className="form-group-pro">
                                            <label>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {t('profile_page.placeholders.confirm_password')}
                                            </label>
                                            <input
                                                type="password"
                                                name="confirm_password"
                                                value={formData.confirm_password}
                                                onChange={handleChange}
                                                className="input-pro"
                                                placeholder={t('profile_page.placeholders.confirm_password')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions-pro">
                                <button
                                    type="submit"
                                    className="btn-save-pro"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            {t('profile_page.saving_btn')}
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                            {t('profile_page.save_btn')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
