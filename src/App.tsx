import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle, Circle, LogOut } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface User {
  username: string;
  token: string;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/todos', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      toast.error('Error fetching todos');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      if (isLogin) {
        const userData = { username: data.username, token: data.token };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Logged in successfully');
      } else {
        toast.success('Registered successfully');
        setIsLogin(true);
      }
      
      setUsername('');
      setPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setTodos([]);
    toast.success('Logged out successfully');
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ text: newTodo }),
      });
      if (!response.ok) throw new Error('Failed to add todo');
      const todo = await response.json();
      setTodos([todo, ...todos]);
      setNewTodo('');
      toast.success('Todo added successfully');
    } catch (error) {
      toast.error('Error adding todo');
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      toast.success('Todo updated successfully');
    } catch (error) {
      toast.error('Error updating todo');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      setTodos(todos.filter(todo => todo.id !== id));
      toast.success('Todo deleted successfully');
    } catch (error) {
      toast.error('Error deleting todo');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 py-12 px-4">
        <Toaster position="top-right" />
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {isLogin ? 'Login' : 'Register'}
            </h1>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                className={`w-full bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
              </button>
            </form>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-500 hover:text-purple-600"
                disabled={isLoading}
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 py-12 px-4">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.username}!</h1>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
          
          <form onSubmit={addTodo} className="flex gap-4 mb-8">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Add
            </button>
          </form>

          <div className="space-y-4">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="text-purple-500 hover:text-purple-600"
                  >
                    {todo.completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <span className={`text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;