import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                }}>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</h1>
                    <h2>Nimadir xato ketdi.</h2>
                    <p style={{ opacity: 0.7, maxWidth: '500px', margin: '1rem 0' }}>
                        Sahifani yuklashda xatolik yuz berdi. Iltimos, sahifani yangilab ko'ring yoki birozdan so'ng qayta urinib ko'ring.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        Sahifani yangilash
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
