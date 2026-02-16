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
    verifyAccessToken: jest.fn((t) => (t === 'test_access_token' ? { userId: 'user-id-123', role: 'user' } : null)),
    verifyRefreshToken: jest.fn((t) => (t === 'test_refresh_token' ? { userId: 'user-id-123' } : null)),
    generateRandomToken: jest.fn(() => 'test_random_token'),
    generateRandomPassword: jest.fn(() => 'test_random_password'),
}));

// Mock email service
jest.unstable_mockModule('../services/email.service.js', () => ({
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
}));

const { default: app } = await import('../server.js');

describe('Auth API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockResolvedValue({ rows: [] });
        mockGetClient.mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
        });
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                full_name: 'Test User',
            };

            mockQuery.mockResolvedValueOnce({ rows: [] }); // Check existing

            const clientQuery = jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [mockUser] }) // Insert User
                .mockResolvedValueOnce({}) // Audit Log
                .mockResolvedValueOnce({}); // COMMIT

            mockGetClient.mockResolvedValueOnce({
                query: clientQuery,
                release: jest.fn(),
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    fullName: 'Test User',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('test@example.com');
        });

        test('should return 409 if user already exists', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    fullName: 'Test User',
                });

            expect(response.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login successfully', async () => {
            const mockUser = {
                id: 'user-id-123',
                email: 'test@example.com',
                password_hash: 'hashed_password123',
                full_name: 'Test User',
                status: 'active',
                email_verified: true,
                role: 'user',
            };

            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

            const clientQuery = jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // Session insert
                .mockResolvedValueOnce({}) // Update last login
                .mockResolvedValueOnce({}) // Audit log
                .mockResolvedValueOnce({}); // COMMIT

            mockGetClient.mockResolvedValueOnce({
                query: clientQuery,
                release: jest.fn(),
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBe('test_access_token');
        });
    });

    describe('POST /api/auth/refresh', () => {
        test('should refresh token successfully', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'user-id-123', role: 'user' }] });

            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'test_refresh_token' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBe('test_access_token');
        });
    });

    describe('POST /api/auth/logout', () => {
        test('should logout successfully', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });

            const response = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken: 'test_refresh_token' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
