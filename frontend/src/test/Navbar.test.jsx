import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import * as AuthContext from '../context/AuthContext';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            language: 'uz',
            changeLanguage: vi.fn(),
        },
    }),
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Navbar Component', () => {
    it('renders brand name', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
        expect(screen.getByText(/Web Kutubxona/i)).toBeInTheDocument();
    });

    it('renders login and register links when not authenticated', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
        expect(screen.getByText(/nav.login/i)).toBeInTheDocument();
        expect(screen.getByText(/nav.register/i)).toBeInTheDocument();
    });

    it('renders navigation links when authenticated', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { id: 1, full_name: 'Test User', role: 'user' },
            isAuthenticated: true,
            isAdmin: false,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
        expect(screen.getByText(/nav.home/i)).toBeInTheDocument();
        expect(screen.getByText(/nav.books/i)).toBeInTheDocument();
        expect(screen.getByText(/nav.library/i)).toBeInTheDocument();
    });
});
