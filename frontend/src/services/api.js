```javascript
import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${ token } `;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 403 and we haven't retried yet
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${ API_URL } /auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data.data;
                localStorage.setItem('accessToken', accessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${ accessToken } `;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    verifyEmail: (token) => api.post('/auth/verify-email', { token }),
    login: (data) => api.post('/auth/login', data),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// ============================================
// BOOKS API
// ============================================
export const booksAPI = {
    getAll: (params) => api.get('/books', { params }),
    getById: (id) => api.get(`/ books / ${ id } `),
    search: (query, filters) => api.get('/books/search', { params: { query, ...filters } }),
    download: (id) => api.post(`/ books / ${ id }/download`, {}, { responseType: 'blob' }),
addReview: (id, data) => api.post(`/books/${id}/review`, data),
    getReviews: (id) => api.get(`/books/${id}/reviews`),
        getCategories: () => api.get('/books/categories'),
            getTrending: (limit = 5) => api.get('/books/trending', { params: { limit } }),
                getNew: (limit = 5) => api.get('/books/new', { params: { limit } }),
                    // Bookmarks & Highlights
                    getBookmarks: (id) => api.get(`/books/${id}/bookmarks`),
                        addBookmark: (id, data) => api.post(`/books/${id}/bookmarks`, data),
                            deleteBookmark: (bookmarkId) => api.delete(`/books/bookmarks/${bookmarkId}`),
                                getHighlights: (id) => api.get(`/books/${id}/highlights`),
                                    addHighlight: (id, data) => api.post(`/books/${id}/highlights`, data),
                                        deleteHighlight: (highlightId) => api.delete(`/books/highlights/${highlightId}`),
                                            getPersonalizedRecommendations: (params) => api.get('/books/recommendations/personalized', { params }),
};

// ============================================
// USER API
// ============================================
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    getLibrary: () => api.get('/user/library'),
    addToLibrary: (bookId) => api.post('/user/library', { bookId }),
    removeFromLibrary: (bookId) => api.delete(`/user/library/${bookId}`),
    getHistory: () => api.get('/user/history'),
    removeHistory: (id) => api.delete(`/user/history/${id}`),
    getReadingProgress: (bookId) => api.get(`/user/reading-progress/${bookId}`),
    updateReadingProgress: (bookId, data) => api.put(`/user/reading-progress/${bookId}`, data),
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
    // Books management
    uploadBook: (formData) => api.post('/admin/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateBook: (id, formData) => api.put(`/admin/books/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteBook: (id) => api.delete(`/admin/books/${id}`),

    // Users management
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),

    // Analytics
    getAnalytics: (period) => api.get('/admin/analytics', { params: { period } }),
    getDownloadLogs: (params) => api.get('/admin/logs/downloads', { params }),
    getResources: () => api.get('/admin/resources'),
};

// ============================================
// STATS & AI API
// ============================================
export const statsAPI = {
    getMyStats: () => api.get('/stats/my'),
    startSession: (bookId) => api.post(`/stats/session/start/${bookId}`),
    endSession: (sessionId) => api.post('/stats/session/end', { sessionId }),
    aiExplain: (text, context) => api.post('/stats/ai/explain', { text, context }),
    getAchievements: () => api.get('/stats/achievements'),
};

// ============================================
// SUPER ADMIN API
// ============================================
export const superAdminAPI = {
    createAdmin: (data) => api.post('/superadmin/admins', data),
    deleteAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
    getAuditLogs: (params) => api.get('/superadmin/audit-logs', { params }),
    updateConfig: (data) => api.put('/superadmin/config', data),
    getConfig: () => api.get('/superadmin/config'),
};

export default api;
