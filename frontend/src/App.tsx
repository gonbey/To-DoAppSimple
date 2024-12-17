import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { RegisterForm } from './components/RegisterForm';
import { LoginForm } from './components/LoginForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { RequestPasswordForm } from './components/RequestPasswordForm';
import { AdminDashboard } from './components/AdminDashboard';
import { TodoList } from './components/TodoList';
import { TodoForm } from './components/TodoForm';
import { AppLayout } from './components/AppLayout';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setIsAdmin(data.is_admin || false);
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/todos" replace={true} />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/todos" replace={true} />
              ) : (
                <>
                  <nav className="flex justify-center space-x-4 mb-8">
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded bg-blue-500 text-white"
                    >
                      ログイン
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded bg-gray-200"
                    >
                      新規登録
                    </Link>
                    <Link
                      to="/request-password-reset"
                      className="px-4 py-2 rounded bg-gray-200"
                    >
                      パスワードを忘れた場合
                    </Link>
                  </nav>
                  <LoginForm onLoginSuccess={checkAuth} />
                </>
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/todos" replace={true} />
              ) : (
                <RegisterForm />
              )
            }
          />
          <Route
            path="/todos"
            element={
              isAuthenticated ? (
                <TodoList />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          />
          <Route
            path="/todo/new"
            element={
              isAuthenticated ? (
                <TodoForm />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          />
          <Route path="/request-password-reset" element={<RequestPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route
            path="*"
            element={<Navigate to="/" replace={true} />}
          />
        </Routes>
        <Toaster />
      </AppLayout>
    </Router>
  );
}

export default App;
