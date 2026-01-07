import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import api from '../../services/api';
import { initSocket } from '../../services/socket';

// Ensure default Leaflet marker images don't error (we use custom DivIcons anyway)
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getShipColor = (type) => {
  const colors = {
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

const makeShipIcon = (v) => {
  const color = getShipColor(v.vessel_type);
  const heading = typeof v.heading === 'number' ? v.heading : 0;
  const html = `
    <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);transform-origin:center center;">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M12 2 L18 12 L12 10 L6 12 Z" fill="${color}" />
        <rect x="11" y="10" width="2" height="8" fill="${color}" />
      </svg>
    </div>
  `;
  return new DivIcon({
    html,
    className: 'ship-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapEventHandler = ({ onMoveEnd, mapRef }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  useMapEvents({
    moveend: () => onMoveEnd(map),
  });
  return null;
};

const ShipMarker = ({ vessel }) => {
  const targetPos = useMemo(() => [vessel.latitude, vessel.longitude], [vessel.latitude, vessel.longitude]);
  const [pos, setPos] = useState(targetPos);

  useEffect(() => {
    const start = pos;
    const end = targetPos;
    const steps = 20;
    const duration = 1000;
    let i = 0;
    const dx = (end[0] - start[0]) / steps;
    const dy = (end[1] - start[1]) / steps;
    const timer = setInterval(() => {
      i += 1;
      const next = [start[0] + dx * i, start[1] + dy * i];
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
        <div style={{ padding: 8 }}>
          <div style={{ fontWeight: 700 }}>{vessel.name || `Vessel ${vessel.mmsi}`}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>MMSI: {vessel.mmsi}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Type: {vessel.vessel_type || 'Unknown'}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Status: {vessel.status || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Speed: {vessel.speed ? `${vessel.speed.toFixed(1)} kn` : 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Course: {vessel.course ? `${vessel.course.toFixed(1)}°` : 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Heading: {typeof vessel.heading === 'number' ? vessel.heading : 'N/A'}</div>
          {vessel.source && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Source: {vessel.source}</div>}
        </div>
      </Popup>
    </Marker>
  );
};

const LiveMap = () => {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center] = useState([20, 0]);
  const [bounds, setBounds] = useState(null);
  const mapRef = useRef(null);

  const loadRealtimeVessels = async (minLat, maxLat, minLon, maxLon) => {
    try {
      setError(null);
      const res = await api.get('/vessels/realtime_positions/', {
        params: { minLat, maxLat, minLon, maxLon },
      });
      const data = res.data || res;
      const list = (data.vessels || []).filter((v) =>
        v && typeof v.latitude === 'number' && typeof v.longitude === 'number' &&
        v.latitude >= -90 && v.latitude <= 90 && v.longitude >= -180 && v.longitude <= 180
      );
      setVessels(list);
      setLoading(false);
    } catch (e) {
      console.error('Failed to load AIS vessels', e);
      setError('Failed to load real-time vessel positions');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadRealtimeVessels();

    // Init socket for live refresh
    const token = localStorage.getItem('token');
    const s = initSocket(token);
    s.on('vessel:position:updated', () => {
      if (bounds) {
        loadRealtimeVessels(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        loadRealtimeVessels();
      }
    });

    const interval = setInterval(() => {
      if (bounds) {
        loadRealtimeVessels(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        loadRealtimeVessels();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      s.disconnect && s.disconnect();
    };
  }, [bounds]);

  const handleMapMove = (map) => {
    const b = map.getBounds();
    const newBounds = {
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLon: b.getWest(),
      maxLon: b.getEast(),
    };
    setBounds(newBounds);
    loadRealtimeVessels(newBounds.minLat, newBounds.maxLat, newBounds.minLon, newBounds.maxLon);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <Typography variant="body1">Loading live vessels…</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>Error loading map</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>{error}</div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>Live Vessel Map</Typography>
      <Typography variant="body2" gutterBottom>
        Real-time AIS positions • {vessels.length} vessels visible
      </Typography>

      <div style={{ height: 700, width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {vessels.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            No vessels to display
          </div>
        ) : (
          <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEventHandler onMoveEnd={handleMapMove} mapRef={mapRef} />
            {vessels.map((v, idx) => (
              <ShipMarker key={`${v.mmsi}-${idx}`} vessel={v} />
            ))}
          </MapContainer>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Typography variant="subtitle1">Legend</Typography>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
          {[
            { label: 'Cargo', color: '#3b82f6' },
            { label: 'Tanker', color: '#ef4444' },
            { label: 'Passenger', color: '#10b981' },
            { label: 'Fishing', color: '#8b5cf6' },
            { label: 'Tug', color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', width: 16, height: 16, marginRight: 8 }}>
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
    </Container>
  );
};

export default LiveMap;
