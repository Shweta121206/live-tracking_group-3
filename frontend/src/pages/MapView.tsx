import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, DivIcon, Map as LeafletMap } from 'leaflet';
import vesselService from '../services/vesselService';
import { connectSocket, subscribeVessels, onVesselPositionUpdated, disconnectSocket } from '../services/socket';

// Fix for default marker icon - use CDN URLs
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

// Component to handle map events and set ref
const MapEventHandler: React.FC<{
  onMoveEnd: (map: LeafletMap) => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
}> = ({ onMoveEnd, mapRef }) => {
  const map = useMap();
  
  // Set the map ref when component mounts
  React.useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  useMapEvents({
    moveend: () => {
      onMoveEnd(map);
    },
  });
  
  return null;
};

const MapView: React.FC = () => {
  const [vessels, setVessels] = useState<RealtimeVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center] = useState<[number, number]>([20, 0]);
  const [bounds, setBounds] = useState<{ minLat: number; maxLat: number; minLon: number; maxLon: number } | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const loadRealtimeVessels = async (minLat?: number, maxLat?: number, minLon?: number, maxLon?: number) => {
    try {
      setError(null);
      console.log('Loading real-time vessel positions from AIS...');
      
      // Use provided bounds or default to global
      const response = await vesselService.getRealtimePositions(minLat, maxLat, minLon, maxLon);
      console.log('Real-time AIS Response:', response);
      
      if (response && response.vessels) {
        const validVessels = response.vessels.filter((v: RealtimeVessel) => {
          const hasCoords = v.latitude != null && v.longitude != null && 
                           !isNaN(v.latitude) && !isNaN(v.longitude) &&
                           v.latitude >= -90 && v.latitude <= 90 &&
                           v.longitude >= -180 && v.longitude <= 180;
          if (!hasCoords) {
            console.warn('Invalid vessel coordinates:', v);
          }
          return hasCoords;
        });
        
        console.log(`Loaded ${validVessels.length} real vessels from ${response.source || 'AIS'}`);
        setVessels(validVessels);
        setLoading(false);
      } else {
        console.warn('No vessels data in response');
        setVessels([]);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Failed to load real-time vessels:', error);
      let errorMessage = 'Failed to load real-time vessel positions';
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view real-time vessel positions. Contact your administrator.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);
    
    // Load initial vessels (global view)
    loadRealtimeVessels();

    // Connect sockets for live updates, trigger refresh on any update
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
    });

    // Fallback polling every 30s
    const interval = setInterval(() => {
      if (bounds) {
        loadRealtimeVessels(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        loadRealtimeVessels();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds]);

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

  const makeShipIcon = (v: RealtimeVessel): DivIcon => {
    const color = getShipColor(v.vessel_type);
    const heading = typeof v.heading === 'number' ? v.heading : 0;
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

  const ShipMarker: React.FC<{ vessel: RealtimeVessel }> = ({ vessel }) => {
    const targetPos = useMemo(() => [vessel.latitude, vessel.longitude] as [number, number], [vessel.latitude, vessel.longitude]);
    const [pos, setPos] = useState<[number, number]>(targetPos);

    useEffect(() => {
      const start: [number, number] = pos;
      const end: [number, number] = targetPos;
      const steps = 20;
      const duration = 1000;
      let i = 0;
      const dx = (end[0] - start[0]) / steps;
      const dy = (end[1] - start[1]) / steps;
      const timer = setInterval(() => {
        i += 1;
        const next: [number, number] = [start[0] + dx * i, start[1] + dy * i];
        setPos(next);
        if (i >= steps) {
          clearInterval(timer);
          setPos(end);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }, [targetPos]);

    return (
      <Marker position={pos} icon={makeShipIcon(vessel)}>
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-lg">{vessel.name || `Vessel ${vessel.mmsi}`}</h3>
            <p className="text-sm text-gray-600">MMSI: {vessel.mmsi}</p>
            <p className="text-sm text-gray-600">Type: {vessel.vessel_type || 'Unknown'}</p>
            <p className="text-sm text-gray-600">Status: {vessel.status || 'N/A'}</p>
            <p className="text-sm text-gray-600">Speed: {vessel.speed ? `${vessel.speed.toFixed(1)} kn` : 'N/A'}</p>
            <p className="text-sm text-gray-600">Course: {vessel.course ? `${vessel.course.toFixed(1)}°` : 'N/A'}</p>
            <p className="text-sm text-gray-600">Heading: {typeof vessel.heading === 'number' ? vessel.heading : 'N/A'}</p>
            <p className="text-sm text-gray-600">Destination: {vessel.destination || 'N/A'}</p>
            {vessel.source && <p className="text-xs text-gray-400 mt-1">Source: {vessel.source}</p>}
          </div>
        </Popup>
      </Marker>
    );
  };

  const handleMapMove = (map: LeafletMap) => {
    const bounds = map.getBounds();
    const newBounds = {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
    };
    setBounds(newBounds);
    // Load vessels for current view
    loadRealtimeVessels(newBounds.minLat, newBounds.maxLat, newBounds.minLon, newBounds.maxLon);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
          <p className="font-medium">Error loading map</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => loadRealtimeVessels()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold  text-white">Live Map</h1>
        <p className="mt-1 text-sm text-white">
          Real-time vessel positions from AIS - {vessels.length} vessels visible
        </p>
        <p className="mt-1 text-xs text-gray-300">
          Map updates every 30 seconds • Ships shown are real-time AIS data
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '700px', width: '100%', position: 'relative' }}>
        {vessels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="mt-2 font-medium">No vessels to display</p>
              <p className="text-sm">Vessels will appear here when they have position data</p>
            </div>
          </div>
        ) : !mapReady ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Initializing map...</div>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={3}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEventHandler onMoveEnd={handleMapMove} mapRef={mapRef} />
            
            {vessels.filter(v => {
              // Ensure coordinates are valid
              return v.latitude !== null && v.latitude !== undefined &&
                     v.longitude !== null && v.longitude !== undefined &&
                     !isNaN(Number(v.latitude)) && !isNaN(Number(v.longitude)) &&
                     v.latitude >= -90 && v.latitude <= 90 &&
                     v.longitude >= -180 && v.longitude <= 180;
            }).map((vessel, index) => (
              <ShipMarker key={`${vessel.mmsi}-${index}`} vessel={vessel} />
            ))}
          </MapContainer>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { label: 'Cargo', color: '#3b82f6' },
            { label: 'Tanker', color: '#ef4444' },
            { label: 'Passenger', color: '#10b981' },
            { label: 'Fishing', color: '#8b5cf6' },
            { label: 'Tug', color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} className="flex items-center">
              <span className="mr-2" style={{ display: 'inline-flex', width: 16, height: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: 'rotate(0deg)' }}>
                  <path d="M12 2 L18 12 L12 10 L6 12 Z" fill={item.color} />
                  <rect x="11" y="10" width="2" height="8" fill={item.color} />
                </svg>
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
