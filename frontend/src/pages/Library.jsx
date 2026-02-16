import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Library.css';

function Library() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchLibrary();
    }, [isAuthenticated]);

    const fetchLibrary = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getLibrary();
            console.log('Library fetched:', response.data);

            // Safety check: ensure response.data.data is an array
            const libraryBooks = Array.isArray(response.data.data) ? response.data.data : [];
            setBooks(libraryBooks);
            setError('');
        } catch (err) {
            console.error('Library fetch error:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBook = async (e, bookId) => {
        e.preventDefault(); // Prevent navigation to book details
        if (!window.confirm(t('library_page.confirm_remove'))) {
            return;
        }

        try {
            await userAPI.removeFromLibrary(bookId);
            // Optimistic update
            setBooks(books.filter(book => book.id !== bookId));
        } catch (err) {
            alert(t('common.error'));
        }
    };

    if (loading) {
        return (
            <div className="library-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                        <p>{t('library_page.loading_text')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="library-page">
            <div className="container">
                {/* Header */}
                <div className="library-header animate-fade-in">
                    <h1>📚 {t('library_page.title')}</h1>
                    <p className="library-subtitle">
                        {t('library_page.subtitle_other', { count: books.length })}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Books Grid */}
                {books.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>{t('library_page.empty_title')}</h3>
                        <p>{t('library_page.empty_desc')}</p>
                        <Link to="/books" className="btn btn-primary">
                            {t('library_page.browse_books')}
                        </Link>
                    </div>
                ) : (
                    <div className="books-grid">
                        {books.map((book, index) => (
                            <div
                                key={book.id}
                                className="book-card card animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <Link to={`/books/${book.id}`} className="book-cover-link">
                                    <div className="book-cover">
                                        {book.cover_image ? (
                                            <img src={book.cover_image.startsWith('http') ? book.cover_image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${book.cover_image}`} alt={book.title} />
                                        ) : (
                                            <div className="book-cover-placeholder">
                                                <span>📖</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="book-info">
                                    <Link to={`/books/${book.id}`} className="book-title-link">
                                        <h3 className="book-title">{book.title}</h3>
                                    </Link>
                                    <p className="book-author">
                                        {book.author_name || t('books_page.unknown_author')}
                                    </p>
                                    <div className="book-meta">
                                        <span className="book-language">
                                            🌐 {book.language_name}
                                        </span>
                                        {Number(book.rating_avg) > 0 && (
                                            <span className="book-rating">
                                                ⭐ {Number(book.rating_avg).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="book-footer">
                                        <span className="book-added-date">
                                            📅 {new Date(book.added_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => handleRemoveBook(e, book.id)}
                                            className="btn-remove"
                                            title={t('library_page.remove_tooltip')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Library;
