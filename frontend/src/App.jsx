import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Lazy loading components for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Library = lazy(() => import('./pages/Library'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBooks = lazy(() => import('./pages/admin/AdminBooks'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const BookReader = lazy(() => import('./pages/BookReader'));
const MainLayout = lazy(() => import('./components/MainLayout'));

// Loading Fallback Component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'var(--bg-primary)'
  }}>
    <div className="spinner-glow" style={{ width: '50px', height: '50px' }}></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Check role if required
  if (requiredRole && user) {
    // If requiredRole is array
    if (Array.isArray(requiredRole) && !requiredRole.includes(user.role)) {
      return <Navigate to="/" />;
    }
    // If requiredRole is string
    if (typeof requiredRole === 'string' && user.role !== requiredRole) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

// Public Route Component (redirect to home if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/" />;
  }

  return children;
}


function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Books Route - Public */}
        <Route path="/books" element={<Books />} />

        {/* Book Detail Route - Public */}
        <Route path="/books/:id" element={<BookDetail />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

      </Route>

      {/* Standalone Protected Routes (Without MainLayout) */}
      <Route
        path="/read/:id"
        element={
          <ProtectedRoute>
            <BookReader />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes - Without Layout or with a minimal one */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Admin Routes - Has its own AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminBooks />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
