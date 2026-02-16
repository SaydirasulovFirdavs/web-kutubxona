import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-wrapper">
            {/* Animated Top Border is handled via CSS ::before */}

            {/* 3. Main Content */}
            <div className="footer-content">
                <div className="footer-grid">

                    {/* Brand Column */}
                    <div className="footer-brand">
                        <h2>Web Kutubxona</h2>
                        <p className="footer-desc">
                            {t('common.footer.brand_desc')}
                        </p>
                        <div className="footer-socials">
                            <a href="#" className="social-icon" aria-label="Telegram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </a>
                            <a href="#" className="social-icon" aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="social-icon" aria-label="Facebook">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h3>{t('common.footer.col_platform')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/">{t('nav.home')}</Link></li>
                            <li><Link to="/books">{t('nav.books')}</Link></li>
                            <li><Link to="/library">{t('nav.library')}</Link></li>
                            <li><Link to="/profile">{t('nav.profile')}</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-col">
                        <h3>{t('common.footer.col_support')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/faq">{t('common.footer.faq')}</Link></li>
                            <li><Link to="/support">{t('common.footer.support')}</Link></li>
                            <li><Link to="/terms">{t('common.footer.terms')}</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-col">
                        <div className="footer-newsletter">
                            <h3>{t('common.footer.col_newsletter')}</h3>
                            <p className="newsletter-text">{t('common.footer.newsletter_desc')}</p>
                            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                                <input type="email" placeholder={t('home.newsletter_placeholder')} className="newsletter-input" />
                                <button type="submit" className="newsletter-btn">{t('home.newsletter_btn')}</button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

            {/* 4. Bottom Bar */}
            <div className="footer-bottom">
                <div className="footer-bottom-content">
                    <p>&copy; {currentYear} Web Kutubxona. {t('common.footer.rights')}</p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link to="/privacy">{t('common.footer.privacy')}</Link>
                        <Link to="/terms">{t('common.footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
