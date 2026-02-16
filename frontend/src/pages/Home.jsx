import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatItem from '../components/StatItem';
import Skeleton from '../components/Skeleton';
import StatsCard from '../components/StatsCard';
import Achievements from '../components/Achievements';
import { booksAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import BookCard from '../components/BookCard';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home = () => {
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [readingHistory, setReadingHistory] = useState([]);
    const [recommendedBooks, setRecommendedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation();

    const quotes = t('home.quotes', { returnObjects: true }) || [
        { text: "Kutubxonalar — bu insoniyatning eng buyuk xotirasi.", author: "Umberto Eko" }
    ];

    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(Math.floor(Math.random() * quotes.length));
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsExiting(true);
            setTimeout(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
                setIsExiting(false);
            }, 600); // Wait for fade out
        }, 8000); // Change every 8 seconds

        return () => clearInterval(interval);
    }, [quotes.length]);

    const dailyQuote = quotes[currentQuoteIndex];

    useEffect(() => {
        fetchHomeData();
    }, [isAuthenticated]);

    const fetchHomeData = async () => {
        try {
            setLoading(true);
            const [booksRes, catsRes] = await Promise.all([
                booksAPI.getAll({ limit: 8, is_featured: true }),
                booksAPI.getCategories()
            ]);

            if (booksRes.data.success) {
                // The API returns { success: true, data: { books: [...], pagination: {...} } }
                setFeaturedBooks(booksRes.data.data.books || []);
            }
            if (catsRes.data.success) {
                setCategories(catsRes.data.data || []);
            }

            if (isAuthenticated) {
                const [historyRes, recsRes] = await Promise.all([
                    userAPI.getHistory(),
                    booksAPI.getPersonalizedRecommendations({ limit: 4 })
                ]);

                if (historyRes.data.success) {
                    setReadingHistory(historyRes.data.data);
                }
                if (recsRes.data.success) {
                    setRecommendedBooks(recsRes.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="home-page animate-in">

            {/* User Stats & Highlights (Gamification) */}
            {isAuthenticated && !loading && (
                <section className="user-stats-section animate-fade-in">
                    <div className="container">
                        <StatsCard />
                        <Achievements />
                    </div>
                </section>
            )}

            {/* Continue Reading (Personalized) */}
            {isAuthenticated && !loading && readingHistory.length > 0 && (
                <section className="continue-reading animate-fade-in">
                    <div className="container">
                        <div className="section-header-compact">
                            <h2 className="section-title-sm">📚 {t('home.continue_reading')}</h2>
                        </div>
                        <div className="history-card-prominent">
                            <div className="history-book-cover">
                                <img src={getImageUrl(readingHistory[0].cover_image)} alt={readingHistory[0].title} />
                            </div>
                            <div className="history-details">
                                <h3>{readingHistory[0].title}</h3>
                                <p>{readingHistory[0].author_name}</p>
                                <div className="reading-progress-bar">
                                    <div className="progress-fill" style={{ width: '65%' }}></div>
                                </div>
                                <Link to={`/read/${readingHistory[0].id}`} className="btn-modern btn-primary-glow btn-sm">
                                    {t('home.continue_btn')} →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Recommended for You (Personalized) */}
            {isAuthenticated && !loading && recommendedBooks.length > 0 && (
                <section className="recommended-section animate-fade-in">
                    <div className="container">
                        <div className="section-header-compact">
                            <h2 className="section-title-sm">✨ {t('home.recommended_for_you')}</h2>
                        </div>
                        <div className="recommended-grid">
                            {recommendedBooks.map(book => (
                                <Link to={`/books/${book.id}`} key={book.id} className="rec-card-mini card glass">
                                    <div className="rec-cover">
                                        <img src={getImageUrl(book.cover_image)} alt={book.title} />
                                    </div>
                                    <div className="rec-info">
                                        <h4>{book.title}</h4>
                                        <p>{book.author_name}</p>
                                        <div className="rec-rating">⭐ {book.rating_avg}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content-wrapper">
                        <div className="hero-text-content">
                            <h1 className="hero-title animate-fade-in">
                                {t('home.hero_title').split('<br>').map((text, i) => (
                                    <React.Fragment key={i}>
                                        {text}
                                        {i === 0 && <br />}
                                    </React.Fragment>
                                ))}
                            </h1>
                            <p className="hero-subtitle animate-delay-1 animate-fade-in">
                                {t('home.hero_desc')}
                            </p>
                            <div className="hero-actions animate-delay-2 animate-fade-in">
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/books" className="btn-modern btn-primary-glow">
                                            <span>{t('nav.books')}</span>
                                            <span>→</span>
                                        </Link>
                                        <Link to="/library" className="btn-modern btn-glass">
                                            <span>{t('nav.library')}</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn-modern btn-primary-glow">
                                            <span>{t('home.start_btn')}</span>
                                            <span>🚀</span>
                                        </Link>
                                        <Link to="/login" className="btn-modern btn-glass">
                                            <span>{t('home.login_btn')}</span>
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div className="hero-stats animate-delay-3 animate-fade-in">
                                <StatItem end={10000} label={t('home.stats_books')} suffix="+" />
                                <StatItem end={5000} label={t('home.stats_readers')} suffix="+" />
                                <StatItem end={4.9} label={t('home.stats_rating')} suffix="" />
                            </div>
                        </div>

                        <div className="hero-visual-container">
                            <div className="logo-ambient-glow"></div>
                            <div className="logo-ring"></div>
                            <div className="logo-ring logo-ring-sm"></div>

                            <svg
                                viewBox="0 0 340 340"
                                className="hero-logo-svg"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect x="0" y="0" width="100" height="100" rx="16" fill="currentColor" />
                                <rect x="120" y="0" width="100" height="100" rx="16" fill="currentColor" />
                                <rect x="240" y="0" width="100" height="100" rx="16" fill="currentColor" />
                                <rect x="120" y="120" width="100" height="100" rx="16" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>


            {/* Featured Books Section */}
            <section className="featured-books">
                <div className="container">
                    <div className="section-header centered">
                        <h2 className="section-title title-pinnacle">{t('home.featured_books_title')}</h2>
                        <p className="section-subtitle">{t('home.featured_books_desc')}</p>
                    </div>

                    {loading ? (
                        <div className="featured-grid">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="book-card-skeleton">
                                    <Skeleton height="320px" borderRadius="24px" />
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <Skeleton width="80%" height="24px" />
                                        <Skeleton width="60%" height="16px" style={{ marginTop: '0.75rem' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredBooks.length > 0 ? (
                        <>
                            <div className="featured-grid">
                                {featuredBooks.map((book, index) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        delay={index * 0.1}
                                    />
                                ))}
                            </div>
                            <div className="featured-actions animate-fade-in">
                                <Link to="/books" className="btn-modern show-all-btn btn-primary-glow">
                                    <span>{t('home.view_all_btn')}</span>
                                    <span className="arrow">→</span>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state centered card glass">
                            <p>{t('home.no_books')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Bento Categories Explorer */}
            <section className="categories-explorer">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title title-pinnacle">{t('home.explore_genres')}</h2>
                        <p className="section-subtitle">{t('home.explore_genres_desc')}</p>
                    </div>

                    {loading ? (
                        <div className="bento-grid">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`bento-item item-${i} skeleton-bento`}>
                                    <Skeleton width="60px" height="60px" borderRadius="50%" />
                                    <Skeleton width="70%" height="28px" style={{ marginTop: '1.5rem' }} />
                                    <Skeleton width="40%" height="18px" style={{ marginTop: '1rem' }} />
                                </div>
                            ))}
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="bento-grid">
                            {categories.slice(0, 5).map((cat, idx) => {
                                const lang = i18n.language ? i18n.language.split('-')[0] : 'uz';
                                const name = cat[`name_${lang}`] || cat.name_uz || cat.name;

                                const getCategoryIcon = (catName) => {
                                    const lowerName = catName.toLowerCase();
                                    if (lowerName.includes('dasturlash')) return '💻';
                                    if (lowerName.includes('bolalar')) return '🧸';
                                    if (lowerName.includes('badiiy')) return '📚';
                                    if (lowerName.includes('darslik')) return '📓';
                                    if (lowerName.includes('tarix')) return '🏛️';
                                    if (lowerName.includes('fan')) return '🔬';
                                    if (lowerName.includes('psixologiya')) return '🧠';
                                    if (lowerName.includes('detektiv')) return '🕵️';
                                    if (lowerName.includes('fantastika')) return '🚀';
                                    return '📖';
                                };

                                return (
                                    <Link
                                        to={`/books?category=${cat.id}`}
                                        key={cat.id}
                                        className={`bento-item item-${idx + 1}`}
                                    >
                                        <div className="bento-icon">{getCategoryIcon(cat.name_uz)}</div>
                                        <h3>{name}</h3>
                                        <span>{cat.book_count || 0} {t('common.books')}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state centered card glass">
                            <p>{t('home.no_categories')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Daily Quote Section */}
            <section className="daily-quote-section">
                <div className="container">
                    <div className={`quote-box glass ${isExiting ? 'quote-exit' : 'quote-enter'}`}>
                        <div className="quote-icon">“</div>
                        <div className="quote-body">
                            <p className="quote-text">{dailyQuote.text}</p>
                            <cite className="quote-author">— {dailyQuote.author}</cite>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="newsletter-section">
                <div className="container">
                    <div className="newsletter-card glass">
                        <div className="newsletter-info">
                            <h2>{t('home.newsletter_title')}</h2>
                            <p>{t('home.newsletter_desc')}</p>
                        </div>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder={t('home.newsletter_placeholder')} className="form-input" />
                            <button type="submit" className="btn-modern btn-primary-glow">{t('home.newsletter_btn')}</button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="section-header centered animate-fade-in">
                        <h2 className="section-title title-pinnacle">{t('home.features_title')}</h2>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card-modern animate-delay-1 animate-fade-in">
                            <div className="icon-box">📚</div>
                            <h3>{t('home.feature_1_title')}</h3>
                            <p>{t('home.feature_1_desc')}</p>
                        </div>
                        <div className="feature-card-modern animate-delay-2 animate-fade-in">
                            <div className="icon-box">⚡</div>
                            <h3>{t('home.feature_2_title')}</h3>
                            <p>{t('home.feature_2_desc')}</p>
                        </div>
                        <div className="feature-card-modern animate-delay-3 animate-fade-in">
                            <div className="icon-box">📱</div>
                            <h3>{t('home.feature_3_title')}</h3>
                            <p>{t('home.feature_3_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="cta animate-fade-in">
                    <div className="container">
                        <div className="cta-card">
                            <div className="cta-content">
                                <h2>{t('home.cta_title')}</h2>
                                <p>{t('home.cta_desc')}</p>
                                <Link to="/register" className="btn-modern btn-primary-glow btn-lg">
                                    {t('home.start_btn')}
                                </Link>
                            </div>
                            <div className="cta-visual">
                                <div className="cta-floating-book">📖</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;
