import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, DivIcon, Map as LeafletMap } from 'leaflet';
import vesselService from '../services/vesselService';
import { connectSocket, subscribeVessels, onVesselPositionUpdated, disconnectSocket } from '../services/socket';
import notificationService, { Notification } from '../services/notificationService';
import { Link } from 'react-router-dom';

// Fix default marker icon
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RealtimeVessel {
  id?: number;
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading: number;
  status: string;
  vessel_type: string;
  destination?: string;
  eta?: string;
  timestamp?: string;
  source: string;
}

const MapEventHandler: React.FC<{
  onMoveEnd: (map: LeafletMap) => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
}> = ({ onMoveEnd, mapRef }) => {
  const map = useMap();
  React.useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  useMapEvents({
    moveend: () => onMoveEnd(map),
  });
  return null;
};

const OperatorDashboard: React.FC = () => {
  // Map + vessels
  const [vessels, setVessels] = useState<RealtimeVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center] = useState<[number, number]>([20, 0]);
  const [bounds, setBounds] = useState<{ minLat: number; maxLat: number; minLon: number; maxLon: number } | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    query: '',
    vessel_type: '',
    cargo_type: '',
    flag_country: '',
    destination: '',
    status: '',
  });

  // Alerts
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Quick stats
  const [stats, setStats] = useState<any>(null);

  const loadRealtimeVessels = async (minLat?: number, maxLat?: number, minLon?: number, maxLon?: number) => {
    try {
      setError(null);
      const response = await vesselService.getRealtimePositions(minLat, maxLat, minLon, maxLon);
      console.log('Realtime positions response:', response);
      const validVessels: RealtimeVessel[] = (response?.vessels || []).filter((v: RealtimeVessel) => {
        const hasCoords = v.latitude != null && v.longitude != null && !isNaN(v.latitude) && !isNaN(v.longitude);
        return hasCoords && v.latitude >= -90 && v.latitude <= 90 && v.longitude >= -180 && v.longitude <= 180;
      });
      console.log('Valid vessels after filtering:', validVessels.length);
      setVessels(validVessels);
      setLoading(false);
    } catch (e: any) {
      console.error('Error loading vessels:', e);
      let errorMessage = 'Failed to load real-time vessel positions';
      if (e.response?.status === 403) {
        errorMessage = 'You do not have permission to view real-time vessel positions.';
      } else if (e.response?.data?.error?.message) {
        errorMessage = e.response.data.error.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      // non-fatal
    }
  };

  const loadStats = async () => {
    try {
      const data = await vesselService.getFleetStatistics();
      setStats(data);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);
    
    loadRealtimeVessels();
    loadNotifications();
    loadStats();

    // Socket real-time
    const s = connectSocket();
    s.on('connect', () => {
      subscribeVessels();
    });
    onVesselPositionUpdated(() => {
      if (bounds) {
        loadRealtimeVessels(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        loadRealtimeVessels();
      }
      loadNotifications();
    });

    const interval = setInterval(() => {
      if (bounds) {
        loadRealtimeVessels(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        loadRealtimeVessels();
      }
      loadNotifications();
    }, 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds]);

  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      const matchesQuery = filters.query
        ? (v.name || '').toLowerCase().includes(filters.query.toLowerCase()) ||
          (v.mmsi || '').toLowerCase().includes(filters.query.toLowerCase())
        : true;
      const matchesType = filters.vessel_type ? (v.vessel_type || '').toLowerCase().includes(filters.vessel_type.toLowerCase()) : true;
      const matchesDest = filters.destination ? (v.destination || '').toLowerCase().includes(filters.destination.toLowerCase()) : true;
      const matchesStatus = filters.status ? (v.status || '').toLowerCase().includes(filters.status.toLowerCase()) : true;
      const matchesFlag = filters.flag_country ? false : true; // flag not available in realtime payload; skip
      const matchesCargo = filters.cargo_type ? false : true; // cargo not available; skip
      return matchesQuery && matchesType && matchesDest && matchesStatus && matchesFlag && matchesCargo;
    });
  }, [vessels, filters]);

  const getShipColor = (type: string): string => {
    const colors: Record<string, string> = {
      cargo: '#3b82f6',
      tanker: '#ef4444',
      passenger: '#10b981',
      fishing: '#8b5cf6',
      tug: '#f59e0b',
      military: '#6b7280',
      sailing: '#06b6d4',
      other: '#111827',
    };
    const vesselType = (type || '').toLowerCase();
    return colors[vesselType] || colors.other;
  };

  const getVesselIcon = (vessel: RealtimeVessel): DivIcon => {
    const color = getShipColor(vessel.vessel_type);
    const heading = typeof vessel.heading === 'number' ? vessel.heading : 0;
    const html = `
      <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);transform-origin:center center;">
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
          <path d="M12 2 L20 10 L18 18 L6 18 L4 10 Z" fill="${color}" stroke="#1f2937" stroke-width="1"/>
          <rect x="11" y="8" width="2" height="10" fill="#6b7280"/>
          <polygon points="13,9 13,16 18,14" fill="${color}" opacity="0.7"/>
        </svg>
      </div>
    `;
    return new DivIcon({
      html,
      className: 'ship-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const handleMapMove = (map: LeafletMap) => {
    const b = map.getBounds();
    const newBounds = { minLat: b.getSouth(), maxLat: b.getNorth(), minLon: b.getWest(), maxLon: b.getEast() };
    setBounds(newBounds);
    loadRealtimeVessels(newBounds.minLat, newBounds.maxLat, newBounds.minLon, newBounds.maxLon);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-6 rounded-lg max-w-md">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-lg">Error Loading Dashboard</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Vessels Loaded</div>
          <div className="text-2xl font-bold text-blue-600">{vessels.length}</div>
          <div className="text-xs text-gray-400 mt-1">{filteredVessels.length} after filters</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Active Ships</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.by_status?.underway || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Ships Delayed</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.by_status?.restricted_maneuverability || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Danger Zone</div>
          <div className="text-2xl font-bold text-red-600">{notifications.filter(n => n.type === 'alert').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Congestion Queue</div>
          <div className="text-2xl font-bold text-purple-600">{notifications.filter(n => n.title?.toLowerCase().includes('congestion')).length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Recent Alerts</div>
          <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
        </div>
      </div>

      {/* Main area: Map + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '700px', width: '100%', position: 'relative' }}>
            {!mapReady ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Initializing map...</div>
              </div>
            ) : filteredVessels.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No vessels to display</p>
                  <p className="text-sm text-gray-400 mt-1">Vessels will appear here when you have assignments</p>
                </div>
              </div>
            ) : (
              <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEventHandler onMoveEnd={handleMapMove} mapRef={mapRef} />
                {filteredVessels.filter(v => {
                  // Ensure coordinates are valid
                  return v.latitude !== null && v.latitude !== undefined &&
                         v.longitude !== null && v.longitude !== undefined &&
                         !isNaN(Number(v.latitude)) && !isNaN(Number(v.longitude)) &&
                         v.latitude >= -90 && v.latitude <= 90 &&
                         v.longitude >= -180 && v.longitude <= 180;
                }).map((vessel, index) => (
                  <Marker key={`${vessel.mmsi}-${index}`} position={[vessel.latitude, vessel.longitude]} icon={getVesselIcon(vessel)}>
                    <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">{vessel.name || `Vessel ${vessel.mmsi}`}</h3>
                      <p className="text-sm text-gray-600">MMSI: {vessel.mmsi}</p>
                      <p className="text-sm text-gray-600">Type: {vessel.vessel_type || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">Status: {vessel.status || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Speed: {vessel.speed ? `${vessel.speed.toFixed(1)} kn` : 'N/A'}</p>
                      <p className="text-sm text-gray-600">Heading: {vessel.heading ?? 'N/A'}</p>
                      <p className="text-sm text-gray-600">Destination: {vessel.destination || 'N/A'}</p>
                      <p className="text-sm text-gray-600">ETA: {vessel.eta || 'N/A'}</p>
                      <div className="flex gap-2 mt-3">
                        <Link to={`/vessels/${vessel.id || vessel.mmsi}`} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Track Vessel</Link>
                        <Link to={`/vessels/${vessel.id || vessel.mmsi}`} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Voyage History</Link>
                        <Link to={`/notifications`} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">Subscribe Alert</Link>
                      </div>
                      {vessel.source && <p className="text-xs text-gray-400 mt-2">Source: {vessel.source}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Filters Side Panel */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ship Search & Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700">Vessel name / MMSI</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Vessel type</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={filters.vessel_type} onChange={(e) => setFilters({ ...filters, vessel_type: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Country flag</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={filters.flag_country} onChange={(e) => setFilters({ ...filters, flag_country: e.target.value })} placeholder="(not available in AIS payload)" />
            </div>
            <div>
              <label className="text-sm text-gray-700">Destination port</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={filters.destination} onChange={(e) => setFilters({ ...filters, destination: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Status</label>
              <select className="mt-1 w-full border rounded px-3 py-2" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Any</option>
                <option value="underway">Moving</option>
                <option value="at_anchor">Anchored</option>
                <option value="moored">Waiting in queue</option>
              </select>
            </div>
            <div className="pt-2 text-xs text-gray-500">Filters apply locally on current AIS results.</div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications Panel */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
          <Link to="/notifications" className="text-blue-600 hover:underline text-sm">View all</Link>
        </div>
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No alerts right now</div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className="p-4 flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${n.type === 'alert' ? 'bg-red-100 text-red-700' : n.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{n.type === 'alert' ? '⚠️' : n.type === 'warning' ? '⚡' : 'ℹ️'}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-800">{n.title}</div>
                    <div className={`text-xs px-2 py-1 rounded ${n.type === 'alert' ? 'bg-red-600 text-white' : n.type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-800'}`}>{n.type}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                  <div className="mt-2 flex gap-2">
                    <button className="px-3 py-1 bg-gray-200 rounded text-sm">Acknowledge</button>
                    <Link to={n.vessel_id ? `/vessels/${n.vessel_id}` : '/vessels'} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Action</Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
