import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import vesselService, { VesselDetail as VesselDetailType, VesselPosition } from '../services/vesselService';
import { format } from 'date-fns';

const VesselDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vessel, setVessel] = useState<VesselDetailType | null>(null);
  const [positions, setPositions] = useState<VesselPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate ID before loading
    if (!id || isNaN(Number(id))) {
      setError('Invalid vessel ID');
      setLoading(false);
      return;
    }
    loadVesselData();
  }, [id]);

  const loadVesselData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vesselId = Number(id);
      if (!vesselId || vesselId <= 0) {
        throw new Error('Invalid vessel ID');
      }
      
      const vesselData = await vesselService.getVessel(vesselId);
      setVessel(vesselData);
      
      // Load track history (last 24 hours)
      try {
        const trackData = await vesselService.getVesselTrack(vesselId);
        setPositions(trackData);
      } catch (err) {
        console.log('No track history available');
        setPositions([]);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load vessel:', err);
      setError(err.response?.data?.error?.message || 'Failed to load vessel details');
      setLoading(false);
    }
  };

  const getVesselIcon = (vesselType: string) => {
    const colors: Record<string, string> = {
      cargo: 'blue',
      tanker: 'red',
      passenger: 'green',
      fishing: 'purple',
      tug: 'orange',
      military: 'gray',
      sailing: 'cyan',
      other: 'black',
    };
    
    const color = colors[vesselType] || 'black';
    
    return new Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      underway: 'bg-green-100 text-green-800',
      at_anchor: 'bg-blue-100 text-blue-800',
      moored: 'bg-purple-100 text-purple-800',
      not_under_command: 'bg-red-100 text-red-800',
      restricted_maneuverability: 'bg-yellow-100 text-yellow-800',
      aground: 'bg-red-200 text-red-900',
      fishing: 'bg-orange-100 text-orange-800',
      under_sail: 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !vessel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-6 rounded-lg max-w-md">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-lg">Error Loading Vessel</p>
              <p className="text-sm mt-1">{error || 'Vessel not found'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/vessels')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Vessels
            </button>
            <button 
              onClick={() => navigate('/vessels/new')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add Vessel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const trackLine = positions.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)] as [number, number]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/vessels')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{vessel.vessel_name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(vessel.status)}`}>
              {vessel.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            MMSI: {vessel.mmsi} | IMO: {vessel.imo_number || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          {vessel.is_tracked && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              🟢 Tracked
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vessel Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vessel Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{vessel.vessel_type.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flag</dt>
                <dd className="text-sm text-gray-900">{vessel.flag_country}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Call Sign</dt>
                <dd className="text-sm text-gray-900">{vessel.call_sign || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Built Year</dt>
                <dd className="text-sm text-gray-900">{vessel.built_year || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Dimensions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimensions</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Gross Tonnage</dt>
                <dd className="text-sm text-gray-900">{vessel.gross_tonnage || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Current Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Speed</dt>
                <dd className="text-sm text-gray-900">{vessel.speed_over_ground ? `${vessel.speed_over_ground} knots` : '0 knots'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Course</dt>
                <dd className="text-sm text-gray-900">{vessel.course_over_ground ? `${vessel.course_over_ground}°` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Heading</dt>
                <dd className="text-sm text-gray-900">{vessel.heading ? `${vessel.heading}°` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Destination</dt>
                <dd className="text-sm text-gray-900">{vessel.destination || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ETA</dt>
                <dd className="text-sm text-gray-900">
                  {vessel.eta ? format(new Date(vessel.eta), 'MMM d, yyyy HH:mm') : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Update</dt>
                <dd className="text-sm text-gray-900">
                  {vessel.last_position_update 
                    ? format(new Date(vessel.last_position_update), 'MMM d, yyyy HH:mm:ss')
                    : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Position & Track</h2>
              <p className="text-sm text-gray-600">
                {vessel.current_coordinates 
                  ? `Lat: ${vessel.current_coordinates[0].toFixed(6)}, Lon: ${vessel.current_coordinates[1].toFixed(6)}`
                  : 'No position data available'}
              </p>
            </div>
            <div style={{ height: '500px' }}>
              {vessel.current_coordinates ? (
                <MapContainer
                  center={vessel.current_coordinates}
                  zoom={8}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Current Position Marker */}
                  <Marker
                    position={vessel.current_coordinates}
                    icon={getVesselIcon(vessel.vessel_type)}
                  />
                  
                  {/* Track Line */}
                  {trackLine.length > 0 && (
                    <Polyline
                      positions={trackLine}
                      color="blue"
                      weight={3}
                      opacity={0.6}
                    />
                  )}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <p className="text-gray-500">No position data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Position History */}
          {positions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Position History ({positions.length} records)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positions.slice(0, 10).map((pos) => (
                      <tr key={pos.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {format(new Date(pos.timestamp), 'MMM d, HH:mm:ss')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {parseFloat(pos.latitude).toFixed(4)}, {parseFloat(pos.longitude).toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {pos.speed_over_ground ? `${pos.speed_over_ground} kn` : '0 kn'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {pos.course_over_ground ? `${pos.course_over_ground}°` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VesselDetail;
