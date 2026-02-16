import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { booksAPI, statsAPI } from '../services/api';
import QuoteCardModal from '../components/QuoteCardModal';
import './BookReader.css';

// Set worker 
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

function BookReader() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState('thumbnails'); // 'thumbnails', 'list', 'bookmarks'
    const [bookmarks, setBookmarks] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showSelectionMenu, setShowSelectionMenu] = useState(false);
    const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [aiResponse, setAiResponse] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Premium Reader Settings
    const [activeReaderTheme, setActiveReaderTheme] = useState(localStorage.getItem('readerTheme') || 'light');
    const [readerFont, setReaderFont] = useState(localStorage.getItem('readerFont') || 'sans');

    console.log('Rendering BookReader, activeReaderTheme:', activeReaderTheme);

    const [showSettings, setShowSettings] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [quoteCardText, setQuoteCardText] = useState('');
    const [isIdle, setIsIdle] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteConfig, setQuoteConfig] = useState({
        theme: 'minimal',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff'
    });

    const contentRef = useRef(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        fetchBook();
        fetchBookmarks();
        fetchHighlights();
    }, [id]);

    useEffect(() => {
        setIsBookmarked(bookmarks.some(b => b.page_number === pageNumber));
    }, [pageNumber, bookmarks]);

    // Scroll active page into view in sidebar
    useEffect(() => {
        if (sidebarRef.current && sidebarOpen) {
            const activeItem = sidebarRef.current.querySelector('.page-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [pageNumber, sidebarOpen]);

    const fetchBook = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getById(id);
            const bookData = response.data.data;
            setBook(bookData);

            // Start reading session
            try {
                const sessionRes = await statsAPI.startSession(id);
                if (sessionRes.data.success) {
                    setSessionId(sessionRes.data.data.sessionId);
                }
            } catch (err) {
                console.error('Failed to start session:', err);
            }
        } catch (err) {
            setError(t('reader.error_fetch'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // End session on unmount
    useEffect(() => {
        return () => {
            if (sessionId) {
                statsAPI.endSession(sessionId).catch(console.error);
            }
        };
    }, [sessionId]);

    // Save reader settings
    useEffect(() => {
        localStorage.setItem('readerTheme', activeReaderTheme);
        localStorage.setItem('readerFont', readerFont);
    }, [activeReaderTheme, readerFont]);

    // Idle detection for Floating UI
    useEffect(() => {
        let idleTimer;
        const handleInteraction = () => {
            setIsIdle(false);
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (!showSettings && !showSelectionMenu) {
                    setIsIdle(true);
                }
            }, 3000);
        };

        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('scroll', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        handleInteraction();

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            clearTimeout(idleTimer);
        };
    }, [showSettings, showSelectionMenu]);

    const fetchBookmarks = async () => {
        try {
            const response = await booksAPI.getBookmarks(id);
            setBookmarks(response.data.data);
        } catch (err) {
            console.error('Fetch bookmarks error:', err);
        }
    };

    const fetchHighlights = async () => {
        try {
            const response = await booksAPI.getHighlights(id);
            setHighlights(response.data.data);
        } catch (err) {
            console.error('Fetch highlights error:', err);
        }
    };

    const handleToggleBookmark = async () => {
        try {
            if (isBookmarked) {
                const bookmark = bookmarks.find(b => b.page_number === pageNumber);
                if (bookmark) {
                    await booksAPI.deleteBookmark(bookmark.id);
                    setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
                }
            } else {
                const response = await booksAPI.addBookmark(id, { page_number: pageNumber });
                setBookmarks([...bookmarks, response.data.data]);
            }
        } catch (err) {
            console.error('Toggle bookmark error:', err);
        }
    };

    const handleTranslate = () => {
        if (!selectedText) return;
        setAiResponse(null);
        handleAIExplain();
    };

    const handleQuoteCard = () => {
        if (!selectedText) return;
        setQuoteCardText(selectedText);
        setIsQuoteModalOpen(true);
    };

    const handleAIExplain = async () => {
        if (!selectedText) return;
        try {
            setIsAiLoading(true);
            setShowSelectionMenu(false);
            const response = await statsAPI.aiExplain(selectedText, book.title);
            setAiResponse(response.data.data);
        } catch (err) {
            console.error('AI Explain error:', err);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleShareQuote = () => {
        setShowSelectionMenu(false);
        setShowQuoteModal(true);
    };

    const handleAddHighlight = async (color) => {
        try {
            const response = await booksAPI.addHighlight(id, {
                text: selectedText,
                position_data: { page: pageNumber },
                color: color
            });
            setHighlights([response.data.data, ...highlights]);
            setShowSelectionMenu(false);
        } catch (err) {
            console.error('Add highlight error:', err);
        }
    };

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const goToPage = (page) => {
        setPageNumber(page);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };

    const previousPage = () => {
        if (pageNumber > 1) goToPage(pageNumber - 1);
    };

    const nextPage = () => {
        if (pageNumber < numPages) goToPage(pageNumber + 1);
    };

    const zoomIn = () => setScale(scale => Math.min(scale + 0.2, 3.0));
    const zoomOut = () => setScale(scale => Math.max(scale - 0.2, 0.5));
    const resetZoom = () => setScale(1.5);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            setSelectedText(text);
            setSelectionPos({
                x: rect.left + rect.width / 2,
                y: rect.top + window.scrollY - 10
            });
            setShowSelectionMenu(true);
        } else {
            setShowSelectionMenu(false);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                previousPage();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageNumber, numPages]);

    if (loading) {
        return (
            <div className="reader-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">{t('reader.loading')}</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="reader-error">
                <div className="error-icon">📚</div>
                <h2>{t('reader.error_title')}</h2>
                <p>{error || t('reader.error_not_found')}</p>
                <button className="btn-back" onClick={() => navigate('/books')}>
                    {t('reader.header.back')}
                </button>
            </div>
        );
    }

    const pdfUrl = book.file_url || (book.file_path ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${book.file_path}` : null);
    const pages = Array.from({ length: numPages || 0 }, (_, i) => i + 1);

    const effectiveTheme = activeReaderTheme || 'light';

    return (
        <div className={`book-reader-pro reader-theme-${effectiveTheme} font-${readerFont} ${isIdle ? 'ui-hidden' : ''}`}>
            {/* Left Sidebar - Page Navigator */}
            <aside className={`reader-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h3>{t('reader.sidebar.title')}</h3>
                    <div className="sidebar-controls">
                        {/* View mode toggle */}
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'thumbnails' ? 'active' : ''}`}
                                onClick={() => setViewMode('thumbnails')}
                                title={t('reader.sidebar.thumbnails_view')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title={t('reader.sidebar.list_view')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'bookmarks' ? 'active' : ''}`}
                                onClick={() => setViewMode('bookmarks')}
                                title={t('reader.sidebar.bookmarks')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'highlights' ? 'active' : ''}`}
                                onClick={() => setViewMode('highlights')}
                                title={t('reader.sidebar.highlights')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                                </svg>
                            </button>
                        </div>
                        <button
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            ◀
                        </button>
                    </div>
                </div>

                {sidebarOpen && (
                    <div className={`page-list ${viewMode}`} ref={sidebarRef}>
                        {viewMode === 'thumbnails' ? (
                            <Document file={pdfUrl} loading="">
                                {pages.map(page => (
                                    <div
                                        key={page}
                                        className={`page-thumbnail-item ${page === pageNumber ? 'active' : ''}`}
                                        onClick={() => goToPage(page)}
                                    >
                                        <div className="thumbnail-wrapper">
                                            <Page
                                                pageNumber={page}
                                                width={140}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                loading={
                                                    <div className="thumbnail-placeholder">
                                                        <span>{page}</span>
                                                    </div>
                                                }
                                            />
                                        </div>
                                        <span className="thumbnail-number">{page}</span>
                                    </div>
                                ))}
                            </Document>
                        ) : viewMode === 'list' ? (
                            pages.map(page => (
                                <button
                                    key={page}
                                    className={`page-item ${page === pageNumber ? 'active' : ''}`}
                                    onClick={() => goToPage(page)}
                                >
                                    <span className="page-number">{page}</span>
                                    <span className="page-label">{t('reader.sidebar.page_label')}</span>
                                </button>
                            ))
                        ) : viewMode === 'bookmarks' ? (
                            <div className="bookmarks-list">
                                {bookmarks.length === 0 ? (
                                    <div className="empty-state">{t('reader.sidebar.empty_bookmarks')}</div>
                                ) : (
                                    bookmarks.map(b => (
                                        <button
                                            key={b.id}
                                            className="bookmark-item"
                                            onClick={() => goToPage(b.page_number)}
                                        >
                                            <div className="bookmark-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            </div>
                                            <div className="bookmark-label">
                                                <span>{b.page_number}{t('reader.sidebar.page_label_short')}</span>
                                                <small>{new Date(b.created_at).toLocaleDateString()}</small>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="highlights-sidebar-list">
                                {highlights.length === 0 ? (
                                    <div className="empty-state">{t('reader.sidebar.empty_highlights')}</div>
                                ) : (
                                    highlights.map(h => (
                                        <div key={h.id} className="highlight-sidebar-item">
                                            <div className="highlight-content">
                                                <span className="quote-mark">“</span>
                                                <p>{h.text}</p>
                                            </div>
                                            <div className="highlight-meta">
                                                <span className="page-link" onClick={() => goToPage(h.position_data?.page || 1)}>
                                                    {t('reader.sidebar.page_label')}: {h.position_data?.page || 1}
                                                </span>
                                                <button className="delete-btn-mini" onClick={async () => {
                                                    await booksAPI.deleteHighlight(h.id);
                                                    setHighlights(highlights.filter(item => item.id !== h.id));
                                                }}>✕</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* Main Content */}
            < div className="reader-main" >
                {/* Header Controls */}
                < header className="reader-header-pro" >
                    <div className="header-left">
                        <button
                            onClick={() => navigate(`/books/${id}`)}
                            className="btn-back-pro"
                            title={t('reader.header.back')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div className="book-title-pro">
                            <span className="title-text">{book.title}</span>
                            {book.author_name && (
                                <span className="author-text">{book.author_name}</span>
                            )}
                        </div>
                    </div>

                    <div className="header-center">
                        <div className="nav-group">
                            <button
                                disabled={pageNumber <= 1}
                                onClick={previousPage}
                                className="nav-btn"
                                title={t('reader.header.previous_page')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <div className="page-indicator">
                                <input
                                    type="number"
                                    value={pageNumber}
                                    min={1}
                                    max={numPages || 1}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val >= 1 && val <= numPages) {
                                            goToPage(val);
                                        }
                                    }}
                                    className="page-input"
                                />
                                <span className="page-divider">/</span>
                                <span className="total-pages">{numPages || '--'}</span>
                            </div>

                            <button
                                disabled={pageNumber >= numPages}
                                onClick={nextPage}
                                className="nav-btn"
                                title={t('reader.header.next_page')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="actions-group">
                            <button
                                onClick={handleToggleBookmark}
                                className={`action-btn ${isBookmarked ? 'active' : ''}`}
                                title={isBookmarked ? t('reader.header.bookmark_remove') : t('reader.header.bookmark_add')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`action-btn ${showSettings ? 'active' : ''}`}
                                title={t('reader.header.settings')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </button>

                            <div className="divider-vr"></div>

                            <div className="zoom-group">
                                <button onClick={zoomOut} className="zoom-btn" title={t('reader.header.zoom_out')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    </svg>
                                </button>
                                <button onClick={resetZoom} className="zoom-percent" title={t('reader.header.zoom_reset')}>
                                    {Math.round(scale * 100)}%
                                </button>
                                <button onClick={zoomIn} className="zoom-btn" title={t('reader.header.zoom_in')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="11" y1="8" x2="11" y2="14"></line>
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="toggle-sidebar-btn"
                            title={sidebarOpen ? t('reader.header.sidebar_close') : t('reader.header.sidebar_open')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                        </button>
                    </div>
                </header >

                {/* PDF Content */}
                < div className="reader-content-pro" ref={contentRef} >
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="pdf-loading">
                                <div className="loading-spinner"></div>
                                <span>{t('reader.pdf.loading')}</span>
                            </div>
                        }
                        error={
                            <div className="pdf-error">
                                <div className="error-icon">⚠️</div>
                                <p>{t('reader.pdf.error_message_1')}</p>
                                <p>{t('reader.pdf.error_message_2')}</p>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={false}
                            className="pdf-page"
                            onMouseUp={handleTextSelection}
                        />
                    </Document>

                    {/* Selection Menu (Highlight/Note/AI) */}
                    {
                        showSelectionMenu && (
                            <div
                                className="selection-menu-pro glass shadow-lg"
                                style={{
                                    left: `${selectionPos.x}px`,
                                    top: `${selectionPos.y - 40}px`
                                }}
                            >
                                <button className="menu-btn ai" onClick={handleAIExplain}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                    <span>{t('reader.selection.ai')}</span>
                                </button>
                                <button className="menu-btn highlight" onClick={() => handleAddHighlight('#ffcf00')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                                        <path d="M2 2l7.5 1.5"></path>
                                        <path d="M7.5 3.5L14 10"></path>
                                    </svg>
                                    <span>{t('reader.selection.highlight')}</span>
                                </button>
                                <button className="menu-btn share" onClick={handleShareQuote}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                    </svg>
                                    <span>{t('reader.selection.share')}</span>
                                </button>
                                <button className="menu-btn note" onClick={() => setShowSelectionMenu(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>{t('reader.selection.note')}</span>
                                </button>
                            </div>
                        )
                    }

                    {/* AI Buddy Response Modal/Bubble */}
                    {
                        (aiResponse || isAiLoading) && (
                            <div className="ai-response-pro glass shadow-xl">
                                <div className="ai-header">
                                    <div className="ai-title">
                                        <span className="sparkle">✨</span> AI Reading Buddy
                                    </div>
                                    <button className="close-ai" onClick={() => setAiResponse(null)}>✕</button>
                                </div>
                                <div className="ai-body">
                                    {isAiLoading ? (
                                        <div className="ai-loading-state">
                                            <div className="spinner-mini"></div>
                                            <span>{t('reader.ai.thinking')}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="ai-text-source">"{selectedText}"</div>
                                            <div className="ai-explanation">{aiResponse}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }
                </div >

                {/* Reader Settings Panel */}
                {showSettings && (
                    <div className="reader-settings-panel glass shadow-xl animate-in">
                        <div className="settings-header">
                            <h4>{t('reader.settings.title')}</h4>
                            <button onClick={() => setShowSettings(false)}>✕</button>
                        </div>

                        <div className="settings-section">
                            <label>{t('reader.settings.theme')}</label>
                            <div className="theme-grid">
                                {['light', 'sepia', 'dark', 'oled'].map(t_val => (
                                    <button
                                        key={t_val}
                                        className={`theme-btn btn-${t_val} ${activeReaderTheme === t_val ? 'active' : ''}`}
                                        onClick={() => setActiveReaderTheme(t_val)}
                                    >
                                        {t(`reader.settings.themes.${t_val}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="settings-section">
                            <label>{t('reader.settings.font')}</label>
                            <div className="font-options">
                                <button
                                    className={`font-btn ${readerFont === 'sans' ? 'active' : ''}`}
                                    onClick={() => setReaderFont('sans')}
                                >
                                    {t('reader.settings.fonts.sans')}
                                </button>
                                <button
                                    className={`font-btn ${readerFont === 'serif' ? 'active' : ''}`}
                                    onClick={() => setReaderFont('serif')}
                                    style={{ fontFamily: 'Merriweather, serif' }}
                                >
                                    {t('reader.settings.fonts.serif')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quote Card Modal */}
                {showQuoteModal && (
                    <div className="quote-modal-overlay animate-fade-in" onClick={() => setShowQuoteModal(false)}>
                        <div className="quote-modal-content glass" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{t('reader.quote.title')}</h3>
                                <button className="close-btn" onClick={() => setShowQuoteModal(false)}>✕</button>
                            </div>

                            <div className="quote-preview-area">
                                <div
                                    className={`quote-card-preview ${quoteConfig.theme}`}
                                    style={{ background: quoteConfig.background, color: quoteConfig.textColor }}
                                    id="quote-card-element"
                                >
                                    <div className="quote-glass-overlay"></div>
                                    <div className="quote-content-wrapper">
                                        <span className="quote-icon">“</span>
                                        <p className="quote-text">{selectedText}</p>
                                        <div className="quote-source">
                                            <div className="source-info">
                                                <span className="book-title">{book.title}</span>
                                                <span className="book-author">{book.author_name}</span>
                                            </div>
                                            <div className="platform-brand">Web Kutubxona</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="quote-designer-controls">
                                <div className="control-group">
                                    <label>{t('reader.quote.choose_bg')}</label>
                                    <div className="bg-presets">
                                        {[
                                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
                                            '#0f172a',
                                            '#ffffff'
                                        ].map(bg => (
                                            <button
                                                key={bg}
                                                className={`bg-thumb ${quoteConfig.background === bg ? 'active' : ''}`}
                                                style={{ background: bg }}
                                                onClick={() => setQuoteConfig({ ...quoteConfig, background: bg, textColor: bg === '#ffffff' ? '#0f172a' : '#ffffff' })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button className="btn btn-primary w-full" onClick={() => {
                                    alert(t('reader.quote.ready_msg'));
                                    // In a real app, we'd use html2canvas here
                                }}>
                                    {t('reader.quote.save_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Progress Bar */}
                <div className="reader-progress">
                    <div
                        className="progress-bar"
                        style={{ width: `${(pageNumber / (numPages || 1)) * 100}%` }}
                    ></div>
                </div>
            </div>

            {isQuoteModalOpen && (
                <QuoteCardModal
                    quote={quoteCardText}
                    bookTitle={book?.title || 'Kitob'}
                    author={book?.author_name || 'Muallif'}
                    onClose={() => setIsQuoteModalOpen(false)}
                />
            )}
        </div>
    );
}

export default BookReader;
