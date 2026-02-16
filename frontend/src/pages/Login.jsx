import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

import LanguageSwitcher from '../components/LanguageSwitcher';
import authHero from '../assets/auth-hero.png';
import uniLogo from '../assets/uni-logo.png';
import './Auth.css';

function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (result.user.role === 'admin' || result.user.role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-left animate-fade-in-left">
                <div className="auth-illustration-wrapper">
                    <img src={authHero} alt="Education Illustration" className="auth-illustration floating" />
                </div>
            </div>

            <div className="auth-right animate-fade-in-right">
                <div className="auth-lang-wrapper">
                    <LanguageSwitcher />
                </div>

                <div className="auth-container">
                    <div className="university-branding animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <img src={uniLogo} alt="University Logo" className="uni-logo-img" />
                        <h1 className="university-name">
                            {t('auth.university_name')}
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && (
                            <div className="alert alert-error mb-4">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="auth-input-group">
                            <div className="auth-input-icon-section">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <input
                                type="email"
                                placeholder={t('auth.email_placeholder')}
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-input-group">
                            <div className="auth-input-icon-section">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.password_placeholder')}
                                className="auth-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {showPassword ? (
                                        <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                                    ) : (
                                        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                                    )}
                                </svg>
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? (
                                    <><span className="spinner"></span><span>{t('auth.logging_in')}</span></>
                                ) : (
                                    <>
                                        {t('auth.login_btn')}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="auth-footer text-center">
                            {t('auth.no_account')} <Link to="/register">{t('auth.register_btn')}</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
