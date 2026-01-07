import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

interface DemoUser {
  email: string;
  role: string;
  name: string;
  password_hint: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const users = await authService.getDemoUsers();
      setDemoUsers(users);
    } catch (error) {
      console.error('Failed to load demo users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });
      await login(email, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error details:', err);
      const errorMessage = err.response?.data?.error?.message 
        || err.message 
        || err.response?.data?.message
        || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: DemoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password_hint);
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/boat-bg.jpg)' }}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Maritime Vessel Tracking
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => handleDemoLogin(user)}
                className={`py-2 px-3 rounded hover:opacity-80 text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : user.role === 'analyst'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={`${user.name} (${user.email})`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
