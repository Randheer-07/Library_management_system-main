import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Authors from './pages/Authors';
import Categories from './pages/Categories';
import Collections from './pages/Collections';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Reservations from './pages/Reservations';
import Fines from './pages/Fines';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px' } }} />
          <Routes>
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="books" element={<Books />} />
              <Route path="books/:id" element={<BookDetail />} />
              <Route path="authors" element={<Authors />} />
              <Route path="categories" element={<Categories />} />
              <Route path="collections" element={<Collections />} />
              <Route path="members" element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']}><Members /></ProtectedRoute>} />
              <Route path="loans" element={<Loans />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="fines" element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']}><Fines /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']}><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
