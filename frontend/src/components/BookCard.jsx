import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageUtils';

const BookCard = memo(({ book, delay = 0 }) => {
    const { t } = useTranslation();

    return (
        <Link
            to={`/books/${book.id}`}
            className="book-card-3d card animate-fade-in"
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="book-card-inner">
                <div className="book-cover-wrapper">
                    <img
                        src={getImageUrl(book.cover_image)}
                        alt={book.title}
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-book.svg" }}
                    />
                </div>
                <div className="book-info-overlay">
                    <h3>{book.title}</h3>
                    <p>{book.author_name}</p>
                    <div className="book-action-hint">
                        {t('common.read_now')} →
                    </div>
                </div>
            </div>

            {/* Extended Info for Grid View (optional/CSS targets this if needed) */}
            <div className="book-info-static">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author_name}</p>
                <div className="book-meta">
                    {book.rating_avg > 0 && <span>⭐ {Number(book.rating_avg).toFixed(1)}</span>}
                    {book.view_count > 0 && <span>👁️ {book.view_count}</span>}
                </div>
            </div>
        </Link>
    );
});

BookCard.displayName = 'BookCard';

export default BookCard;
