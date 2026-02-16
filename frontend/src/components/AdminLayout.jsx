import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import '../pages/admin/Admin.css';
import logo from '../assets/uni-logo.png';

function AdminLayout({ children }) {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            // Use setTimeout to avoid immediate closing
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showProfileMenu]);

    const handleLogout = () => {
        logout();
        setShowProfileMenu(false);
        navigate('/'); // Navigate to home page
    };

    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    const isActive = (path) => location.pathname === path;

    // Check for super admin role (role_id 3 or role name)
    const roleTitle = (user?.role_id === 3 || user?.role === 'super_admin') ? 'Super Admin' : 'Admin';

    return (
        <div className="admin-layout">
            {/* Collapsed Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <button className="sidebar-icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <nav className="admin-nav">
                    <Link
                        to="/admin"
                        className={`admin-nav-item ${isActive('/admin') ? 'active' : ''}`}
                        title={t('admin.dashboard')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </Link>
                    <Link
                        to="/admin/books"
                        className={`admin-nav-item ${isActive('/admin/books') ? 'active' : ''}`}
                        title={t('nav.books')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </Link>
                    <Link
                        to="/admin/users"
                        className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
                        title={t('admin.users')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Top Header */}
                <header className="admin-header">
                    <div className="header-brand">
                        <img src={logo} alt="Uni Logo" className="uni-logo-header" />
                        <span className="uni-title">TOSHKENT AMALIY FANLAR UNIVERSITETI</span>
                    </div>

                    <div className="header-user">
                        <LanguageSwitcher />

                        {/* Profile with dropdown */}
                        <div
                            ref={dropdownRef}
                            className="user-profile"
                            style={{ cursor: 'pointer', position: 'relative' }}
                        >
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                onClick={toggleProfileMenu}
                            >
                                <div className="user-avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{user?.full_name?.toUpperCase() || 'ADMIN USER'}</span>
                                    <span className="user-role">{roleTitle}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div
                                    className="profile-dropdown"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '0.5rem',
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        border: '1px solid #e2e8f0',
                                        minWidth: '180px',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="logout-btn"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1.25rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#ef4444',
                                            fontWeight: 500
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="admin-content animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
