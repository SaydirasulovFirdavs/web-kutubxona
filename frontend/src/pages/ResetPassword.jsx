
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Noto\'g\'ri yoki eskirgan havola.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            setStatus('error');
            setMessage('Parollar mos kelmadi');
            return;
        }

        if (passwords.newPassword.length < 6) {
            setStatus('error');
            setMessage('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
            return;
        }

        setStatus('loading');

        try {
            await authAPI.resetPassword(token, passwords.newPassword);
            setStatus('success');
            setMessage('Parol muvaffaqiyatli o\'zgartirildi! Sizni kirish sahifasiga yo\'naltirmoqdamiz...');

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Xatolik yuz berdi');
        }
    };

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card card glass">
                    <div className="alert alert-error">
                        Havola noto'g'ri. Iltimos, emailngizni qaytadan tekshiring.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card card glass animate-fade-in">
                <div className="auth-header">
                    <h2>🔐 Yangi parol o'rnatish</h2>
                    <p>Iltimos, yangi parolingizni kiriting.</p>
                </div>

                {status === 'success' ? (
                    <div className="alert alert-success">
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {status === 'error' && (
                            <div className="alert alert-error">
                                {message}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Yangi parol</label>
                            <input
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                className="form-input"
                                placeholder="Eng kamida 6 ta belgi"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Parolni tasdiqlang</label>
                            <input
                                type="password"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                className="form-input"
                                placeholder="Parolni qayta kiriting"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Saqlanmoqda...' : 'Parolni saqlash'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
