import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/request-reset" element={<RequestPasswordForm />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/todos"
            element={
              isAuthenticated ? (
                <TodoList />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/todo/new"
            element={
              isAuthenticated ? (
                <TodoForm />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/todo/:id"
            element={
              isAuthenticated ? (
                <TodoForm />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/todos" replace />
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
                      to="/request-reset"
                      className="px-4 py-2 rounded bg-gray-200"
                    >
                      パスワードを忘れた場合
                    </Link>
                  </nav>
                  <LoginForm />
                </>
              )
            }
          />
          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          />
          <Route path="/register" element={<RegisterForm />} />
        </Routes>
        <Toaster />
      </AppLayout>
    </Router>
  );
}

export default App;
