import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import analyticsService, { AnalyticsData } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect operators to dashboard
    if (user?.role === 'operator') {
      navigate('/dashboard');
      return;
    }
    loadAnalytics();
  }, [user, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { vessel_statistics, speed_analytics, activity_timeline, notification_analytics, fleet_overview, destination_analytics } = analytics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-white mt-1">Comprehensive fleet insights and statistics</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vessels</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{vessel_statistics.total_vessels}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-green-600 text-sm font-medium">
              {vessel_statistics.active_vessels} Active
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 text-sm">
              {vessel_statistics.inactive_vessels} Inactive
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Speed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{speed_analytics.average_speed}</p>
              <p className="text-sm text-gray-500">knots</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Max: {speed_analytics.max_speed} | Min: {speed_analytics.min_speed}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{notification_analytics.total_notifications}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-orange-600 font-medium">{notification_analytics.unread_notifications} Unread</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tonnage</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {(fleet_overview.total_tonnage / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-gray-500">gross tons</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Avg: {fleet_overview.average_tonnage.toFixed(0)} tons
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vessel Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vessel Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vessel_statistics.by_status}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {vessel_statistics.by_status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vessel Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vessel Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vessel_statistics.by_type}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vessel_type" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Vessels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Updates (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activity_timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="updates" stroke="#10b981" strokeWidth={2} name="Updates" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Speed Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Speed Distribution (knots)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speed_analytics.speed_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Vessels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Age Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fleet_overview.age_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.category}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="category"
              >
                {fleet_overview.age_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries (by vessel count)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vessel_statistics.by_country} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="flag_country" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Vessels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Destination Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Destinations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={destination_analytics.top_destinations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="destination" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ec4899" name="Vessels" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="flex flex-col justify-center space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">With Destination</p>
              <p className="text-2xl font-bold text-gray-900">{destination_analytics.total_with_destination}</p>
            </div>
            <div className="border-l-4 border-gray-300 pl-4">
              <p className="text-sm text-gray-600">Without Destination</p>
              <p className="text-2xl font-bold text-gray-900">{destination_analytics.total_without_destination}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Top Destinations</p>
              <p className="text-2xl font-bold text-gray-900">{destination_analytics.top_destinations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={notification_analytics.by_type}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.type}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="type"
              >
                {notification_analytics.by_type.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total Notifications</p>
              <p className="text-3xl font-bold text-blue-900">{notification_analytics.total_notifications}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-600">Unread</p>
              <p className="text-3xl font-bold text-orange-900">{notification_analytics.unread_notifications}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600">Last 7 Days</p>
              <p className="text-3xl font-bold text-green-900">{notification_analytics.recent_7_days}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
