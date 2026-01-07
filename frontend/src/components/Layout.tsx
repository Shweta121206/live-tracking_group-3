import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      const unread = notifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      backgroundImage: 'url(/port1.jpeg)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <nav className="bg-[rgb(71,140,148)] text-white shadow-lg">
        <div className="w-[70%] mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold">
                Maritime Tracking
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/vessels"
                  className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/vessels')}`}
                >
                  Vessels
                </Link>
                <Link
                  to="/map"
                  className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/map')}`}
                >
                  Map
                </Link>
                <Link
                  to="/operator"
                  className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/operator')}`}
                >
                  Operator
                </Link>
                {user?.role !== 'operator' && (
                  <Link
                    to="/analytics"
                    className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/analytics')}`}
                  >
                    Analytics
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/admin')}`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/notifications"
                className="relative p-2 hover:bg-blue-700 rounded"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              
              <Link
                to="/settings"
                className="p-2 hover:bg-blue-700 rounded"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
              
                <div className="flex items-center space-x-2">
                <span className="text-sm">{user?.email}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
                </div>
                
                <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full"
                >
                Logout
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-[70%] mx-auto px-4 py-6 flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray text-white mt-auto">
        <div className="w-[70%] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Maritime Tracking System</h3>
              <p className="text-gray-300 text-sm">
                Real-time vessel tracking and monitoring solution for maritime operations.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/dashboard" className="text-gray-300 hover:text-white">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/vessels" className="text-gray-300 hover:text-white">
                    Vessels
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="text-gray-300 hover:text-white">
                    Map View
                  </Link>
                </li>
                {user?.role !== 'operator' && (
                  <li>
                    <Link to="/analytics" className="text-gray-300 hover:text-white">
                      Analytics
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Email: support@maritime-tracking.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>Emergency: +1 (555) 911-0000</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-300">
            <p>&copy; {new Date().getFullYear()} Maritime Tracking System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;