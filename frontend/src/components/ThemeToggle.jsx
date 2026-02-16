import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useAuth();

    return (
        <button
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Tungi rejimga o\'tish' : 'Kunduzgi rejimga o\'tish'}
        >
            <div className="toggle-track">
                <div className="toggle-thumb">
                    <span className="icon sun">☀️</span>
                    <span className="icon moon">🌙</span>
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;
