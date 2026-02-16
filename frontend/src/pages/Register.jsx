import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

import LanguageSwitcher from '../components/LanguageSwitcher';
import authHero from '../assets/auth-hero.png';
import uniLogo from '../assets/uni-logo.png';
import './Auth.css';

function Register() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.password_mismatch'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('auth.password_min_length'));
            return;
        }

        setLoading(true);

        const result = await register(formData.email, formData.password, formData.fullName);

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
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

                        {success && (
                            <div className="alert alert-success mb-4">
                                <span>✅</span>
                                <span>{success}</span>
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
                                type="text"
                                name="fullName"
                                placeholder={t('auth.full_name_placeholder')}
                                className="auth-input"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-input-group">
                            <div className="auth-input-icon-section">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder={t('auth.email_placeholder')}
                                className="auth-input"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                placeholder={t('auth.password_placeholder')}
                                className="auth-input"
                                value={formData.password}
                                onChange={handleChange}
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
                                name="confirmPassword"
                                placeholder={t('auth.confirm_placeholder')}
                                className="auth-input"
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                                    <><span className="spinner"></span><span>{t('auth.registering')}</span></>
                                ) : (
                                    <>
                                        {t('auth.register_btn')}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="auth-footer text-center">
                            {t('auth.have_account')} <Link to="/login">{t('auth.login_btn')}</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
