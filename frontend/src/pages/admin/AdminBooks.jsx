import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI, booksAPI } from '../../services/api';
import BookUploadForm from '../../components/BookUploadForm';
import { getImageUrl } from '../../utils/imageUtils';
import './Admin.css';

function AdminBooks() {
    const { t } = useTranslation();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getAll({ limit: 100 });
            setBooks(response.data.data.books);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.confirm_delete'))) return;

        try {
            await adminAPI.deleteBook(id);
            fetchBooks();
            alert(t('admin.book_deleted'));
        } catch (err) {
            console.error('Delete error:', err);
            console.error('Error response:', err.response?.data);
            alert('Xatolik yuz berdi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setShowUpload(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeForm = () => {
        setShowUpload(false);
        setEditingBook(null);
    };

    return (
        <div className="admin-books">
            <div className="admin-header-actions">
                <h1 className="admin-page-title">{t('admin.books_management')}</h1>
                <button
                    className="btn-primary"
                    onClick={() => {
                        if (showUpload) {
                            closeForm();
                        } else {
                            setEditingBook(null);
                            setShowUpload(true);
                        }
                    }}
                >
                    {showUpload ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            {t('admin.cancel')}
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            {t('admin.add_book')}
                        </>
                    )}
                </button>
            </div>

            {showUpload && (
                <div className="upload-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <BookUploadForm
                        initialData={editingBook}
                        onSuccess={() => {
                            closeForm();
                            fetchBooks();
                        }}
                        onCancel={closeForm}
                    />
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="col-cover">{t('admin.table_cover')}</th>
                            <th className="col-title">{t('admin.table_book_info')}</th>
                            <th className="col-author">{t('admin.table_author_lang')}</th>
                            <th className="col-status">{t('admin.table_status')}</th>
                            <th className="col-actions">{t('admin.table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map(book => (
                            <tr key={book.id}>
                                <td className="col-cover">
                                    <div className="table-book-cover">
                                        <img src={getImageUrl(book.cover_image)} alt={book.title} />
                                    </div>
                                </td>
                                <td className="col-title">
                                    <span className="table-book-title">{book.title}</span>
                                    <span className="table-book-format">{book.file_format?.toUpperCase() || 'PDF'}</span>
                                    <div className="table-stats" style={{ marginTop: '0.5rem' }}>
                                        <span className="stat-item" title={t('book_detail.views')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            {book.view_count || 0}
                                        </span>
                                        <span className="stat-item" title={t('book_detail.downloads')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            {book.download_count || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="col-author">
                                    <div className="table-author-name">{book.author_name || t('books_page.unknown_author')}</div>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                                        {book.language_name || 'O\'zbek'} • {book.publish_year || '-'}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>
                                        {book.publisher}
                                    </span>
                                </td>
                                <td className="col-status">
                                    <span className="status-badge active">
                                        <span className="status-dot"></span>
                                        {t('admin.active')}
                                    </span>
                                </td>
                                <td className="col-actions">
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn edit"
                                            onClick={() => handleEdit(book)}
                                            title={t('admin.edit_book')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDelete(book.id)}
                                            title={t('admin.confirm_delete')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {books.length === 0 && !loading && (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <p>{t('admin.no_books')}</p>
                        <button className="btn-primary" onClick={() => setShowUpload(true)}>
                            {t('admin.add_first_book')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminBooks;
