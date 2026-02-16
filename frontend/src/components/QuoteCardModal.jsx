import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './QuoteCardModal.css';

const QuoteCardModal = ({ quote, bookTitle, author, onClose }) => {
    const cardRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('classic');

    const handleExport = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `quote-${bookTitle.substring(0, 10)}.png`;
            link.href = image;
            link.click();
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const themes = {
        classic: { background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', color: '#1a202c' },
        dark: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc' },
        gold: { background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#2d3748' },
        nature: { background: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)', color: '#ffffff' },
        purple: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' }
    };

    return (
        <div className="quote-modal-overlay glass animate-fade-in" onClick={onClose}>
            <div className="quote-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Iqtibos Kartasi 🖼️</h3>
                    <button className="close-modal" onClick={onClose}>✕</button>
                </div>

                <div className="theme-selector">
                    {Object.keys(themes).map(t => (
                        <button
                            key={t}
                            className={`theme-dot ${selectedTheme === t ? 'active' : ''}`}
                            style={{ background: themes[t].background }}
                            onClick={() => setSelectedTheme(t)}
                            title={t}
                        />
                    ))}
                </div>

                <div
                    ref={cardRef}
                    className={`quote-card-preview theme-${selectedTheme}`}
                    style={{ background: themes[selectedTheme].background, color: themes[selectedTheme].color }}
                >
                    <div className="quote-mark">“</div>
                    <p className="quote-text-main">{quote}</p>
                    <div className="quote-footer">
                        <div className="quote-book-info">
                            <span className="quote-book-title">{bookTitle}</span>
                            <span className="quote-author-name">{author}</span>
                        </div>
                        <div className="quote-watermark">Web Kutubxona</div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-modern btn-primary-glow btn-block"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Yuklanmoqda...' : 'Rasm sifatida saqlash ✨'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteCardModal;
