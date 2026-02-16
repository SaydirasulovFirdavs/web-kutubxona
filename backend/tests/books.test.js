import { jest } from '@jest/globals';
import request from 'supertest';

// Diagnostic mock
const mockQuery = jest.fn();
const mockGetClient = jest.fn();

// Mock the database module
jest.unstable_mockModule('../config/database.js', () => ({
    query: mockQuery,
    getClient: mockGetClient,
    default: {
        on: jest.fn(),
    },
}));

// Mock security utils 
jest.unstable_mockModule('../utils/security.js', () => ({
    hashPassword: jest.fn(async (p) => 'hashed_' + p),
    comparePassword: jest.fn(async (p, h) => h === 'hashed_' + p),
    generateAccessToken: jest.fn(() => 'test_access_token'),
    generateRefreshToken: jest.fn(() => 'test_refresh_token'),
    verifyAccessToken: jest.fn((t) => (t === 'valid_token' ? { userId: 'user-id-123', role: 'user' } : null)),
    verifyRefreshToken: jest.fn((t) => (t === 'valid_refresh_token' ? { userId: 'user-id-123' } : null)),
    generateRandomToken: jest.fn(() => 'test_random_token'),
    generateRandomPassword: jest.fn(() => 'test_random_password'),
}));

// Mock email service to prevent hanging handles and connection errors
jest.unstable_mockModule('../services/email.service.js', () => ({
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
}));

const { default: app } = await import('../server.js');

describe('Books API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock behavior
        mockQuery.mockResolvedValue({ rows: [] });
        mockGetClient.mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
        });
    });

    describe('GET /api/books', () => {
        test('should return a list of active books', async () => {
            const mockBooks = [
                { id: '1', title: 'Book 1', status: 'active' },
                { id: '2', title: 'Book 2', status: 'active' }
            ];

            mockQuery
                .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
                .mockResolvedValueOnce({ rows: mockBooks }); // Data query

            const response = await request(app)
                .get('/api/books')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.books).toHaveLength(2);
        });
    });

    describe('GET /api/books/:id', () => {
        test('should return book details for a valid ID', async () => {
            const mockBook = {
                id: 'book-id-123',
                title: 'Book Details',
                status: 'active',
                categories: []
            };

            mockQuery
                .mockResolvedValueOnce({ rows: [mockBook] }) // Get book
                .mockResolvedValueOnce({}); // Increment view count

            const response = await request(app).get('/api/books/book-id-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Book Details');
        });
    });

    describe('POST /api/books/library', () => {
        const mockUser = {
            id: 'user-id-123',
            status: 'active',
            role: 'user'
        };

        test('should add book to library when authenticated', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [mockUser] }) // Auth middleware user fetch
                .mockResolvedValueOnce({ rows: [{ id: 'book-id-123' }] }) // Check book exists
                .mockResolvedValueOnce({}); // Insert into library

            const response = await request(app)
                .post('/api/books/library')
                .set('Authorization', 'Bearer valid_token')
                .send({ bookId: 'book-id-123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('qo\'shildi');
        });

        test('should return 401 when not authenticated', async () => {
            const response = await request(app)
                .post('/api/books/library')
                .send({ bookId: 'book-id-123' });

            expect(response.status).toBe(401);
        });
    });
});
