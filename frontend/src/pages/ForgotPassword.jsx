
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await authAPI.forgotPassword(email);
            setStatus('success');
            setMessage(response.data.message);
        } catch (err) {
            setStatus('error');
            setMessage('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card glass animate-fade-in">
                <div className="auth-header">
                    <h2>🔐 Parolni tiklash</h2>
                    <p>Email manzilingizni kiriting va biz sizga parolni tiklash uchun havola yuboramiz.</p>
                </div>

                {status === 'success' ? (
                    <div className="alert alert-success">
                        <p>{message}</p>
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Link to="/login" className="btn btn-primary btn-sm">
                                Kirish sahifasiga qaytish
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {status === 'error' && (
                            <div className="alert alert-error">
                                {message}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="example@mail.com"
                                required
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Yuborilmoqda...' : 'Havolani yuborish'}
                        </button>

                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">
                                ← Ortga qaytish
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
