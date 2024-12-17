import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Todo App</h1>
        {isAuthenticated && (
          <nav className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => navigate('/todos')}
              className="px-4 py-2 rounded bg-blue-500 text-white"
            >
              Todo一覧
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              ログアウト
            </button>
          </nav>
        )}
        {children}
      </div>
    </div>
  );
}
