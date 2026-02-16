import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { booksAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Skeleton from '../components/Skeleton';
import './Books.css';

function Books() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const categoryContainerRef = useRef(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 12
    });

    const scrollCategories = (direction) => {
        if (categoryContainerRef.current) {
            const scrollAmount = 200;
            categoryContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search');
        const urlCategory = params.get('category');

        if (urlSearch !== null) setSearch(urlSearch);
        if (urlCategory !== null) setSelectedCategory(parseInt(urlCategory));

        fetchCategories();
    }, [location.search]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBooks();
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [pagination.currentPage, search, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await booksAPI.getCategories();
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchBooks = async () => {
        // Prevent fetch if loading is already true to avoid race conditions (optional, but good practice if not cancelling)
        // actually for debounce we just want the latest.

        try {
            setLoading(true);
            const response = await booksAPI.getAll({
                page: pagination.currentPage,
                limit: 12,
                search: search || undefined,
                category: selectedCategory || undefined
            });

            setBooks(response.data.data.books);
            setPagination(response.data.data.pagination);
            setError('');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.message || t('common.error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Since we have debounce, this just ensures IMMEDIATE fetch if user presses Enter
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchBooks();
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="books-page">
            <div className="container">
                <div className="back-link-wrapper">
                    <button onClick={() => navigate('/')} className="back-btn">
                        <span>←</span> {t('books_page.back_btn')}
                    </button>
                </div>
                {/* Header */}
                <div className="books-header animate-fade-in">
                    <h1>📚 {t('books_page.title')}</h1>
                    <p className="books-subtitle">
                        {t('books_page.subtitle_other', { count: pagination.totalBooks || 0 })}
                    </p>
                </div>

                {/* Categories Filter */}
                <div className="categories-wrapper animate-fade-in">
                    <button
                        className="category-scroll-btn left"
                        onClick={() => scrollCategories('left')}
                        aria-label="Scroll left"
                    >
                        ❮
                    </button>

                    <div className="categories-filter" ref={categoryContainerRef}>
                        <button
                            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(null)}
                        >
                            {t('common.all')}
                        </button>
                        {categories.map(category => {
                            // Normalize language code (e.g., 'uz-UZ' -> 'uz', 'en-US' -> 'en')
                            const lang = i18n.language ? i18n.language.split('-')[0] : 'uz';

                            // Try to get name in current language, fallback to name_uz, then name
                            const categoryName = category[`name_${lang}`] || category.name_uz || category.name;

                            return (
                                <button
                                    key={category.id}
                                    className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange(category.id)}
                                >
                                    {categoryName}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        className="category-scroll-btn right"
                        onClick={() => scrollCategories('right')}
                        aria-label="Scroll right"
                    >
                        ❯
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="search-form animate-fade-in">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="form-input search-input"
                            placeholder={t('books_page.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            🔍 {t('books_page.search_btn')}
                        </button>
                    </div>
                </form>

                {/* Error */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Content Area (Loader, Empty State, or Grid) */}
                {loading ? (
                    <div className="books-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="book-card-skeleton">
                                <Skeleton height="280px" borderRadius="16px" />
                                <div style={{ padding: '1.5rem' }}>
                                    <Skeleton width="90%" height="24px" />
                                    <Skeleton width="60%" height="18px" style={{ marginTop: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <Skeleton width="40%" height="14px" />
                                        <Skeleton width="40%" height="14px" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : books.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>{t('books_page.no_books_title')}</h3>
                        <p>{t('books_page.no_books_desc')}</p>
                    </div>
                ) : (
                    <>
                        <div className="books-grid">
                            {books.map((book, index) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    delay={index * 0.05}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                >
                                    ← {t('books_page.prev_page')}
                                </button>
                                <span className="pagination-info">
                                    {t('books_page.page_info', { current: pagination.currentPage, total: pagination.totalPages })}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                >
                                    {t('books_page.next_page')} →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Books;
