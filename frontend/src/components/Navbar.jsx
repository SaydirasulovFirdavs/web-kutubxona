import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/uni-logo.png';
import './Navbar.css';
import { useState, useEffect, useRef } from 'react';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const searchRef = useRef(null);
    const profileRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Instant search effect
    useEffect(() => {
        if (search.trim().length >= 2) {
            setIsSearching(true);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await booksAPI.getAll({ search: search, limit: 5 });
                    setSearchResults(response.data.data.books);
                } catch (err) {
                    console.error('Quick search error:', err);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [search]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 992);
            if (window.innerWidth > 992) {
                setIsMenuOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/books?search=${encodeURIComponent(search.trim())}`);
            setIsSearchOpen(false);
            setSearch('');
            setIsMenuOpen(false);
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link';
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container-fluid">
                <div className="navbar-content">
                    {/* Left: Logo */}
                    <Link to="/" className="navbar-logo">
                        <img src={logo} alt="University Logo" className="logo-img" />
                        <span className="logo-text">KUTUBXONA</span>
                    </Link>

                    {/* Mobile Menu Button */}
                    {isMobile && (
                        <button className="mobile-menu-btn" onClick={toggleMenu}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isMenuOpen ? <line x1="18" y1="6" x2="6" y2="18"></line> : <line x1="3" y1="12" x2="21" y2="12"></line>}
                                {isMenuOpen ? <line x1="6" y1="6" x2="18" y2="18"></line> : <line x1="3" y1="6" x2="21" y2="6"></line>}
                                {!isMenuOpen && <line x1="3" y1="18" x2="21" y2="18"></line>}
                            </svg>
                        </button>
                    )}

                    {/* Navbar Menu */}
                    <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                        {/* Center: Navigation Links */}
                        {isAuthenticated && (
                            <div className="nav-center">
                                <Link to="/" className={isActive('/')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.home')}
                                </Link>
                                <Link to="/books" className={isActive('/books')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.books')}
                                </Link>
                                <Link to="/library" className={isActive('/library')} onClick={() => setIsMenuOpen(false)}>
                                    {t('nav.library')}
                                </Link>
                                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                    <Link to="/admin" className={`admin-link ${isActive('/admin')}`} onClick={() => setIsMenuOpen(false)}>
                                        {t('nav.admin')}
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Right: Auth & Search */}
                        {/* Right: Actions (Search, Theme, Lang, Profile) */}
                        <div className="nav-right">
                            {/* Grouped Controls: Search, Theme, Lang */}
                            <div className="nav-controls-group glass">
                                {/* 1. Search */}
                                <div ref={searchRef} className={`nav-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                                    <form onSubmit={handleSearch} className="nav-search-form">
                                        <input
                                            type="text"
                                            placeholder={t('nav.search_placeholder')}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="nav-search-input"
                                        />
                                        <button type="submit" className="nav-search-submit">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                        </button>

                                        {/* Instant Search Dropdown */}
                                        {(searchResults.length > 0 || isSearching) && isSearchOpen && (
                                            <div className="search-dropdown-pro glass">
                                                {isSearching ? (
                                                    <div className="search-loading-pro">
                                                        <div className="spinner-mini"></div>
                                                        <span>{t('nav.search_searching')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="search-results-list">
                                                        {searchResults.map(book => (
                                                            <Link
                                                                key={book.id}
                                                                to={`/books/${book.id}`}
                                                                className="search-result-item"
                                                                onClick={() => {
                                                                    setIsSearchOpen(false);
                                                                    setSearch('');
                                                                    setIsMenuOpen(false);
                                                                }}
                                                            >
                                                                <div className="result-thumb">
                                                                    <img src={book.cover_image ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${book.cover_image}` : '/book-placeholder.png'} alt={book.title} />
                                                                </div>
                                                                <div className="result-info">
                                                                    <div className="result-title">{book.title}</div>
                                                                    <div className="result-author">{book.author_name}</div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                        <Link
                                                            to={`/books?search=${encodeURIComponent(search)}`}
                                                            className="search-view-all"
                                                            onClick={() => {
                                                                setIsSearchOpen(false);
                                                                setSearch('');
                                                                setIsMenuOpen(false);
                                                            }}
                                                        >
                                                            {t('nav.search_view_all')}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </form>
                                    <button className="nav-search-toggle" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </button>
                                </div>

                                <div className="controls-divider"></div>

                                {/* 2. Theme Toggle */}
                                <ThemeToggle />

                                <div className="controls-divider"></div>

                                {/* 3. Language Switcher */}
                                <LanguageSwitcher />
                            </div>

                            {/* 4. Profile / Auth */}
                            <div className="auth-buttons">
                                {isAuthenticated ? (
                                    <div className="user-actions" ref={profileRef}>
                                        <button
                                            className={`profile-btn ${isProfileOpen ? 'active' : ''}`}
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            title={user?.full_name}
                                        >
                                            <div className="profile-icon-wrapper">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                        </button>

                                        {isProfileOpen && (
                                            <div className="profile-dropdown glass animate-slide-up">
                                                <div className="dropdown-header">
                                                    <p className="dropdown-name">{user?.full_name}</p>
                                                    <p className="dropdown-email">{user?.email}</p>
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    {t('nav.profile')}
                                                </Link>
                                                <button onClick={logout} className="dropdown-item logout-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                                    {t('nav.logout')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="guest-actions">
                                        <Link to="/login" className="btn-login" onClick={() => setIsMenuOpen(false)}>
                                            {t('nav.login')}
                                        </Link>
                                        <Link to="/register" className="btn-register" onClick={() => setIsMenuOpen(false)}>
                                            {t('nav.register')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav >
    );
}

export default Navbar;
