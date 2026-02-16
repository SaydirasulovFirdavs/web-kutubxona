import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StarRating from '../components/StarRating';
import { getImageUrl } from '../utils/imageUtils';
import './BookDetail.css';

function BookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [book, setBook] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBookAndReviews();
    }, [id]);

    const fetchBookAndReviews = async () => {
        try {
            setLoading(true);
            const [bookRes, reviewsRes] = await Promise.all([
                booksAPI.getById(id),
                booksAPI.getReviews(id)
            ]);

            setBook(bookRes.data.data);
            setReviews(reviewsRes.data.data);
            setError('');
        } catch (err) {
            if (err.response?.status === 404) {
                setError(t('book_detail.not_found') || 'Kitob topilmadi');
            } else {
                setError(t('common.error'));
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            const response = await booksAPI.download(id);

            // Create a blob from the response data
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);

            // Try to get filename from content-disposition header
            let fileName = `${book.title}.${book.file_format || 'pdf'}`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }

            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Refresh to update download count
            const bookRes = await booksAPI.getById(id);
            setBook(bookRes.data.data);
        } catch (err) {
            console.error('Download error:', err);
            alert(t('common.error'));
        }
    };

    const handleAddToLibrary = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            await userAPI.addToLibrary(id);
            alert(t('common.save_success'));
        } catch (err) {
            alert(t('common.error'));
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            setSubmitting(true);
            await booksAPI.addReview(id, { rating, comment });

            // Refresh reviews
            const reviewsRes = await booksAPI.getReviews(id);
            setReviews(reviewsRes.data.data);

            // Reset form
            setComment('');
            setRating(5);

            // Refresh book rating stats
            const bookRes = await booksAPI.getById(id);
            setBook(bookRes.data.data);

            alert(t('common.review_added'));
        } catch (err) {
            alert(t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="book-detail-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="book-detail-page">
                <div className="container">
                    <div className="error-state glass">
                        <h2>⚠️ {t('common.error')}</h2>
                        <p>{error}</p>
                        <Link to="/books" className="btn btn-primary">
                            ← {t('book_detail.back_to_books')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="book-detail-page">
            <div className="container">
                {/* Back button */}
                <Link to="/books" className="back-link">
                    ← {t('book_detail.back_to_books')}
                </Link>

                {/* Book Header */}
                <div className="book-header glass">
                    <div className="book-cover-large">
                        <img src={getImageUrl(book.cover_image)} alt={book.title} />
                    </div>

                    <div className="book-main-info">
                        <h1 className="book-title">{book.title}</h1>

                        <div className="book-author">
                            <strong>{t('book_detail.author')}:</strong> {book.author_name || t('common.unknown_author')}
                        </div>

                        <div className="book-meta-grid">
                            <div className="meta-item">
                                <span className="meta-label">{t('book_detail.language')}:</span>
                                <span className="meta-value">{book.language_name}</span>
                            </div>
                            {book.pages && (
                                <div className="meta-item">
                                    <span className="meta-label">{t('book_detail.pages')}:</span>
                                    <span className="meta-value">{book.pages}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <span className="meta-label">{t('book_detail.format')}:</span>
                                <span className="meta-value">{book.file_format?.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="book-stats-large">
                            <div className="stat-item">
                                <span className="stat-icon">👁️</span>
                                <span className="stat-value">{book.view_count}</span>
                                <span className="stat-label">{t('book_detail.views')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">💾</span>
                                <span className="stat-value">{book.download_count}</span>
                                <span className="stat-label">{t('book_detail.downloads')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">⭐</span>
                                <span className="stat-value">{typeof book.rating_avg === 'string' ? parseFloat(book.rating_avg).toFixed(1) : book.rating_avg.toFixed(1)}</span>
                                <span className="stat-label">({book.rating_count} {t('book_detail.rating')})</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="book-actions">
                            <button
                                onClick={handleDownload}
                                className="btn btn-primary btn-lg"
                            >
                                💾 {t('book_detail.download_btn')}
                            </button>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) return navigate('/login');
                                    navigate(`/read/${id}`);
                                }}
                                className="btn btn-secondary btn-lg"
                            >
                                📖 {t('book_detail.read_btn')}
                            </button>
                            <button
                                onClick={handleAddToLibrary}
                                className="btn btn-outline btn-lg"
                            >
                                🧡 {t('book_detail.save_btn')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="book-content-grid">
                    <div className="book-info-col">
                        {/* Description */}
                        {book.description && (
                            <div className="book-section card">
                                <h2>📝 {t('book_detail.description')}</h2>
                                <p className="book-description">{book.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="book-reviews-col">
                        {/* Review Form */}
                        <div className="book-section card">
                            <h2>⭐ {t('book_detail.write_review')}</h2>
                            {isAuthenticated ? (
                                <form onSubmit={handleReviewSubmit} className="review-form">
                                    <div className="form-group">
                                        <label>{t('book_detail.rating_label')}</label>
                                        <StarRating rating={rating} setRating={setRating} size="lg" />
                                    </div>
                                    <div className="form-group">
                                        <textarea
                                            className="form-input"
                                            rows="3"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={t('book_detail.comment_placeholder')}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? t('book_detail.submitting_btn') : t('book_detail.submit_btn')}
                                    </button>
                                </form>
                            ) : (
                                <div className="auth-message-box">
                                    <p>{t('book_detail.login_to_review')}</p>
                                    <Link to="/login" className="btn btn-sm btn-outline">{t('book_detail.login_btn')}</Link>
                                </div>
                            )}
                        </div>

                        {/* Reviews List */}
                        <div className="book-section card">
                            <h2>💬 {t('book_detail.reviews_title')} ({reviews.length})</h2>
                            {reviews.length > 0 ? (
                                <div className="reviews-list">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="review-item">
                                            <div className="review-header">
                                                <span className="review-author">{review.user_name}</span>
                                                <span className="review-date">
                                                    {new Date(review.created_at).toLocaleDateString('uz-UZ')}
                                                </span>
                                            </div>
                                            <div className="review-rating">
                                                <StarRating rating={review.rating} readOnly={true} size="sm" />
                                            </div>
                                            <p className="review-text">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-reviews">{t('book_detail.no_reviews')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookDetail;
