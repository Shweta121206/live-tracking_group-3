# Real-Time Vessel Tracking API - Updated Documentation

## Overview

The real-time API provides live vessel position data from AIS (Automatic Identification System) sources with full role-based access control for Operators, Analysts, and Admins.

## Key Updates

### 1. Enhanced `realtime_positions` Endpoint

**Endpoint:** `GET /api/vessels/realtime_positions/`

**Access:** All authenticated users (Operators, Analysts, Admins)

**Description:** Fetches real-time vessel positions from AIS data sources with support for geographic filtering

**Query Parameters:**
- `min_lat` (float, default: -90): Minimum latitude
- `max_lat` (float, default: 90): Maximum latitude  
- `min_lon` (float, default: -180): Minimum longitude
- `max_lon` (float, default: 180): Maximum longitude

**Validation:**
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- min_lat must be ≤ max_lat
- min_lon must be ≤ max_lon

**Response Example:**
```json
{
  "success": true,
  "data": {
    "vessels": [
      {
        "mmsi": "219000606",
        "name": "OPAL QUEEN",
        "latitude": 55.567,
        "longitude": 12.345,
        "speed": 12.3,
        "course": 245.0,
        "heading": 244,
        "status": "underway",
        "vessel_type": "Cargo",
        "destination": "ROTTERDAM",
        "eta": "2025-12-18T14:00:00Z",
        "timestamp": "2025-12-18T10:30:45Z",
        "source": "aishub"
      }
    ],
    "count": 150,
    "source": "aishub_free",
    "timestamp": "2025-12-18T10:30:45.123456Z",
    "user_role": "operator"
  }
}
```

**Error Responses:**

Invalid Bounding Box:
```json
{
  "success": false,
  "error": {
    "message": "Invalid latitude range: must be between -90 and 90, min_lat <= max_lat",
    "details": "..."
  }
}
```

Server Error:
```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch real-time vessel positions",
    "details": "Error message (in DEBUG mode only)"
  }
}
```

### 2. Enhanced `update_from_ais` Endpoint

**Endpoint:** `POST /api/vessels/{id}/update_from_ais/`

**Access:** Operators and Admins only

**Description:** Updates a specific vessel's position from live AIS data

**Requirements:**
- Vessel must have an MMSI number
- User must be Operator or Admin

**Response Example:**
```json
{
  "success": true,
  "data": {
    "vessel": {
      "id": 123,
      "mmsi": "219000606",
      "vessel_name": "OPAL QUEEN",
      "latitude": 55.567,
      "longitude": 12.345,
      "speed_over_ground": 12.3,
      "course_over_ground": 245.0,
      "heading": 244,
      "status": "underway",
      "last_position_update": "2025-12-18T10:30:45.123456Z",
      ...
    },
    "message": "Vessel position updated from aishub",
    "updated_at": "2025-12-18T10:30:45.123456Z"
  }
}
```

**Error Responses:**

Missing MMSI:
```json
{
  "success": false,
  "error": {
    "message": "Vessel must have an MMSI number to fetch AIS data",
    "vessel_id": 123,
    "vessel_name": "Unknown Vessel"
  }
}
```

No AIS Data Available:
```json
{
  "success": false,
  "error": {
    "message": "No AIS data available for this vessel",
    "mmsi": "219000606",
    "details": "Could not fetch data from any AIS source"
  }
}
```

Invalid Coordinates:
```json
{
  "success": false,
  "error": {
    "message": "Invalid coordinates received from AIS source",
    "lat": 95.5,
    "lon": 200.0
  }
}
```

## AIS Data Sources (Priority Order)

1. **MarineSia API** (FREE)
   - Website: https://api.marinesia.com
   - Update Frequency: Real-time
   - Coverage: Global
   - No API key required for basic queries

2. **AISHub API** (FREE - Demo Access)
   - Website: http://www.aishub.net
   - Update Frequency: Real-time
   - Coverage: Global
   - Uses `AH_DEMO` username for free access
   - Most reliable for area queries

3. **MarineTraffic API** (Paid)
   - Website: https://www.marinetraffic.com
   - Requires: API key in settings
   - Fallback if above sources fail

4. **Mock Data** (Development)
   - Used when all APIs fail
   - Returns realistic data with common shipping routes
   - Source: `mock_development`

## Role-Based Access Control

### Operator
- ✅ Can view real-time positions
- ✅ Can update vessel positions from AIS
- ✅ Can view fleet statistics
- ✅ Can view map data
- ❌ Cannot see analytics (analyst-only)

### Analyst
- ✅ Can view real-time positions (for map analytics)
- ✅ Can view fleet statistics
- ✅ Can view analytics dashboard
- ✅ Can view destination analytics
- ❌ Cannot update vessel positions

### Admin
- ✅ All permissions
- ✅ Can update vessel positions from AIS
- ✅ Can perform bulk operations
- ✅ Can manage users

## Frontend Integration

### MapView Component
- Displays real-time vessels on map
- Uses `getRealtimePositions()` with bounds-based filtering
- Updates on map movement
- Supports WebSocket for live updates

### OperatorDashboard Component
- Shows fleet overview
- Real-time vessel positions
- Quick stats
- Notifications integration

### Analytics Component
- Fleet statistics
- Speed analytics
- Activity timelines
- Destination analytics
- Status distribution charts

## Implementation Checklist

✅ Backend API endpoints with role-based access
✅ AIS service with multiple data source support
✅ Input validation and error handling
✅ Frontend integration with error messages
✅ WebSocket support for live updates
✅ Mock data for development/testing
✅ Comprehensive logging
✅ Documentation

## Testing the API

### Test Real-Time Positions
```bash
curl -X GET "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With bounding box
curl -X GET "http://localhost:8000/api/vessels/realtime_positions/?min_lat=30&max_lat=50&min_lon=-10&max_lon=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Update from AIS
```bash
curl -X POST "http://localhost:8000/api/vessels/123/update_from_ais/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Configuration

Required settings in `.env`:
```
DEBUG=True  # Set to False in production
MARINETRAFFIC_API_KEY=  # Optional: Paid API key
MARINESIA_API_KEY=      # Optional: MarineSia API key
STORMGLASS_API_KEY=     # Optional: Weather data API key
```

## Performance Considerations

1. **Real-time Updates:**
   - API response time: < 5 seconds for global queries
   - Typical vessel count: 100-500 per geographic area
   - Database queries optimized with indexing

2. **Caching:**
   - Consider implementing Redis caching for frequently requested areas
   - Cache TTL: 30-60 seconds

3. **Rate Limiting:**
   - Implement rate limiting for API endpoints
   - Recommended: 100 requests/minute per user

## Future Enhancements

1. WebSocket support for continuous updates
2. Redis caching layer
3. Historical track playback
4. Advanced filtering options
5. Weather data integration
6. Predictive routing
7. Anomaly detection
