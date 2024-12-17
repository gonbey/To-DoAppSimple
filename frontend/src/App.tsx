import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { RegisterForm } from './components/RegisterForm';
import { LoginForm } from './components/LoginForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { RequestPasswordForm } from './components/RequestPasswordForm';
import { AdminDashboard } from './components/AdminDashboard';
import { TodoList } from './components/TodoList';
import { TodoForm } from './components/TodoForm';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Todo App</h1>
          {isAuthenticated && (
            <nav className="flex justify-center space-x-4 mb-8">
              <Link
                to="/todos"
                className="px-4 py-2 rounded bg-blue-500 text-white"
              >
                Todo一覧
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2 rounded bg-gray-200"
              >
                管理者ダッシュボード
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="px-4 py-2 rounded bg-red-500 text-white"
              >
                ログアウト
              </button>
            </nav>
          )}
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
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
