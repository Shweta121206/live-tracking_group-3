import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vessels from './pages/Vessels';
import VesselDetail from './pages/VesselDetail';
import VesselForm from './pages/VesselForm';
import MapView from './pages/MapView';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import OperatorDashboard from './pages/OperatorDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/operator" element={<OperatorDashboard />} />
              <Route path="/vessels" element={<Vessels />} />
              <Route path="/vessels/new" element={<VesselForm />} />
              <Route path="/vessels/:id" element={<VesselDetail />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
