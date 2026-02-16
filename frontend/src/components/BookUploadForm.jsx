import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../services/api';
import '../pages/admin/Admin.css'; // Ensure CSS is applied

function BookUploadForm({ onSuccess, initialData = null, onCancel }) {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author_id: '',
        new_author_name: '',
        language_id: '',
        category_ids: [],
        new_category_name: '',
        publisher: '',
        publish_year: new Date().getFullYear(), // Default current year
        pages: '',
        status: 'active', // Default status
        type: 'pdf' // Default type
    });

    const [file, setFile] = useState(null);
    const [coverImage, setCoverImage] = useState(null); // State for cover image file
    const [coverPreview, setCoverPreview] = useState(null); // State for preview URL
    const [isNewAuthor, setIsNewAuthor] = useState(false); // Toggle for new author input
    const [isNewCategory, setIsNewCategory] = useState(false); // Toggle for new category input

    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState({ authors: [], languages: [], categories: [] });

    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Fetch resources (authors, languages)
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await adminAPI.getResources();
                if (response.data?.data) {
                    setResources(response.data.data);
                }
            } catch (error) {
                console.error('Failed to load resources:', error);
            }
        };
        fetchResources();
    }, []);

    // Load initial data if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                author_id: initialData.author_id || '',
                new_author_name: '',
                language_id: initialData.language_id || '',
                category_ids: initialData.category_ids || [],
                new_category_name: '',
                publisher: initialData.publisher || '',
                publish_year: initialData.publish_year || '',
                pages: initialData.pages || '',
                status: initialData.status || 'active',
                type: initialData.file_format || 'pdf'
            });
            if (initialData.cover_image) {
                const imageUrl = initialData.cover_image.startsWith('http')
                    ? initialData.cover_image
                    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${initialData.cover_image}`;
                setCoverPreview(imageUrl);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleCoverChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setCoverImage(selectedFile);
            setCoverPreview(URL.createObjectURL(selectedFile));
        }
    };

    const toggleAuthorMode = () => {
        setIsNewAuthor(!isNewAuthor);
        // Clear the respective field when toggling
        if (!isNewAuthor) {
            setFormData(prev => ({ ...prev, author_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, new_author_name: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Require files for new books
        if (!initialData) {
            if (!file) {
                alert(t('admin.upload_pdf'));
                return;
            }
            if (!coverImage) {
                alert(t('admin.upload_cover'));
                return;
            }
        }

        // Validate author - either select or new
        if (!isNewAuthor && !formData.author_id) {
            // No author selected and not adding new - that's ok, author is optional
        }

        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                // Don't send empty new_author_name if selecting existing author
                if (key === 'new_author_name' && !isNewAuthor) return;
                // Don't send author_id if adding new author
                if (key === 'author_id' && isNewAuthor) return;

                // Don't send new_category_name if selecting existing category
                if (key === 'new_category_name' && !isNewCategory) return;
                // Don't send category_ids if adding new category
                if (key === 'category_ids' && isNewCategory) return;

                data.append(key, formData[key]);
            });

            if (file) data.append('file', file);
            if (coverImage) data.append('cover_image', coverImage);

            if (initialData) {
                await adminAPI.updateBook(initialData.id, data);
            } else {
                await adminAPI.uploadBook(data);
            }

            alert(initialData ? t('admin.book_updated') : t('admin.book_added'));
            onSuccess?.();

            if (!initialData) {
                // Reset form
                setFormData({
                    title: '', description: '', author_id: '', new_author_name: '',
                    language_id: '', category_ids: [], new_category_name: '', publisher: '',
                    publish_year: new Date().getFullYear(), pages: '', status: 'active', type: 'pdf'
                });
                setFile(null);
                setCoverImage(null);
                setCoverPreview(null);
                setIsNewAuthor(false);
                setIsNewCategory(false);
            }

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || 'Noma\'lum xatolik';
            alert('Xatolik yuz berdi: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="book-upload-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="form-header-title">{initialData ? t('admin.edit_book') : t('admin.add_ebook')}</h3>
                {onCancel && <button onClick={onCancel} style={{ marginRight: '2rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>}
            </div>

            <form onSubmit={handleSubmit} className="upload-form-grid">
                {/* Left Column: Cover Image */}
                <div className="cover-upload-section">
                    <div
                        className="image-preview-box"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} alt="Cover Preview" className="image-preview-img" />
                        ) : (
                            <>
                                <div className="placeholder-icon">🖼️</div>
                                <span style={{ color: '#94a3b8' }}>{t('admin.main_book_image')}</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={coverInputRef}
                            onChange={handleCoverChange}
                            className="hidden-input"
                        />
                    </div>

                    <button
                        type="button"
                        className="select-image-btn"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {t('admin.select_image')}
                    </button>
                </div>

                {/* Right Column: Details */}
                <div className="details-form-section">
                    {/* Title */}
                    <div className="form-group full-width">
                        <label>{t('admin.title')}</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-control"
                            placeholder={t('admin.title_placeholder')}
                            required
                        />
                    </div>

                    {/* Author section with toggle */}
                    <div className="form-group full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ margin: 0 }}>{t('admin.author')}</label>
                            <button
                                type="button"
                                onClick={toggleAuthorMode}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                {isNewAuthor ? t('admin.or_select_existing') : t('admin.add_new_author')}
                            </button>
                        </div>

                        {isNewAuthor ? (
                            <input
                                type="text"
                                name="new_author_name"
                                value={formData.new_author_name}
                                onChange={handleChange}
                                className="form-control"
                                placeholder={t('admin.new_author_placeholder')}
                            />
                        ) : (
                            <select
                                name="author_id"
                                value={formData.author_id}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="">{t('admin.select_author')}</option>
                                {resources.authors.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Publisher, Year row */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('admin.publisher')}</label>
                            <input
                                type="text"
                                name="publisher"
                                value={formData.publisher}
                                onChange={handleChange}
                                className="form-control"
                                placeholder={t('admin.publisher_placeholder')}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('admin.year_of_issue')}</label>
                            <input
                                type="number"
                                name="publish_year"
                                value={formData.publish_year}
                                onChange={handleChange}
                                className="form-control"
                                placeholder={t('admin.year_of_issue')}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('admin.language')}</label>
                            <select
                                name="language_id"
                                value={formData.language_id}
                                onChange={handleChange}
                                className="form-control"
                                required
                            >
                                <option value="">{t('admin.select')}</option>
                                {resources.languages.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status, Category, Type row */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('admin.status')}</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="active">{t('admin.active')}</option>
                                <option value="inactive">{t('admin.inactive')}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>
                                {t('admin.category')}
                                <button
                                    type="button"
                                    className="toggle-author-btn"
                                    onClick={() => {
                                        setIsNewCategory(!isNewCategory);
                                        setFormData(prev => ({ ...prev, category_ids: [], new_category_name: '' }));
                                    }}
                                >
                                    {isNewCategory ? t('admin.or_select_existing') : t('admin.add_new_category')}
                                </button>
                            </label>
                            {isNewCategory ? (
                                <input
                                    type="text"
                                    name="new_category_name"
                                    value={formData.new_category_name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder={t('admin.new_category_placeholder')}
                                    required
                                />
                            ) : (
                                <select
                                    name="category_ids"
                                    value={formData.category_ids[0] || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category_ids: [e.target.value] }))}
                                    className="form-control"
                                    required
                                >
                                    <option value="">{t('admin.select_category')}</option>
                                    {resources.categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name_uz}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="form-group">
                            <label>{t('admin.type')}</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="pdf">PDF</option>
                                <option value="epub">EPUB</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group full-width">
                        <label>{t('admin.description')}</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-control"
                            placeholder={t('admin.description_placeholder')}
                        ></textarea>
                    </div>

                    {/* Footer Actions */}
                    <div className="form-footer-action">
                        {/* File Attachment */}
                        <div
                            className="file-attachment-box"
                            onClick={() => fileInputRef.current?.click()}
                            title={file ? file.name : t('admin.select_file')}
                        >
                            <input
                                type="file"
                                accept="application/pdf"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden-input"
                            />
                            <span className="attach-icon">📎</span>
                            <span>{file ? t('admin.selected') : t('admin.select')}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="save-btn" style={{ backgroundColor: '#94a3b8' }} onClick={onCancel}>
                                {t('admin.cancel')}
                            </button>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? t('admin.saving') : t('admin.save')}
                            </button>
                        </div>
                    </div>
                </div >
            </form >
        </div >
    );
}

export default BookUploadForm;
