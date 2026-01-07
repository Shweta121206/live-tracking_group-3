# Real-Time Vessel Tracking API - Quick Reference Guide

## 🚀 Quick Start

### Running the Backend
```bash
cd backend
python3 manage.py runserver
# API available at http://localhost:8000
```

### Running the Frontend
```bash
cd frontend
npm install
npm start
# App available at http://localhost:3000
```

---

## 📡 API Endpoints

### Get Real-Time Vessel Positions
```bash
GET /api/vessels/realtime_positions/
Authorization: Bearer <token>

Query Parameters (optional):
  ?min_lat=-90&max_lat=90&min_lon=-180&max_lon=180
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/vessels/realtime_positions/?min_lat=30&max_lat=50&min_lon=-10&max_lon=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vessels": [...],
    "count": 150,
    "source": "aishub_free",
    "timestamp": "2025-12-18T10:30:45.123456Z",
    "user_role": "operator"
  }
}
```

---

### Update Vessel from Live AIS
```bash
POST /api/vessels/{id}/update_from_ais/
Authorization: Bearer <token>
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/vessels/123/update_from_ais/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vessel": {...},
    "message": "Vessel position updated from aishub",
    "updated_at": "2025-12-18T10:30:45.123456Z"
  }
}
```

---

## 👥 Role Permissions

### Operator
- ✅ View real-time vessel positions
- ✅ Update vessel positions from AIS
- ✅ View fleet statistics
- ✅ View map data

### Analyst
- ✅ View real-time vessel positions (for analytics)
- ✅ View fleet statistics
- ✅ View analytics dashboard
- ❌ Cannot update vessel positions

### Admin
- ✅ All Operator permissions
- ✅ All Analyst permissions
- ✅ Perform bulk operations
- ✅ Manage users

---

## 🗺️ Frontend Components

### MapView Component
- Displays real-time vessels on interactive map
- Filters by bounding box as you pan/zoom
- Live updates via WebSocket

**URL:** `/map`

### OperatorDashboard
- Fleet overview with key metrics
- Real-time vessel positions
- Quick statistics
- Notifications feed

**URL:** `/dashboard` (for operators)

### Analytics Dashboard
- Fleet statistics
- Speed analytics
- Activity timeline
- Destination analytics
- Status distribution

**URL:** `/analytics` (for analysts only)

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
DEBUG=True                          # Set False in production
MARINETRAFFIC_API_KEY=             # Optional paid API
MARINESIA_API_KEY=                 # Optional free API
STORMGLASS_API_KEY=                # Optional weather data
```

### Database
- Type: SQLite3
- Location: `db.sqlite3`
- ORM: Django ORM

### Cache (Optional)
- Enable Redis for better performance
- Cache TTL: 30-60 seconds recommended
- Reduces AIS API calls significantly

---

## 📊 Data Sources (Fallback Chain)

1. **MarineSia** (FREE)
   - Endpoint: https://api.marinesia.com
   - No API key required
   - Real-time global coverage

2. **AISHub** (FREE)
   - Endpoint: http://data.aishub.net
   - Demo access: AH_DEMO username
   - Excellent for area queries

3. **MarineTraffic** (PAID)
   - Requires API key in settings
   - More comprehensive data
   - Fallback if free sources unavailable

4. **Mock Data** (DEVELOPMENT)
   - Auto-generated realistic data
   - Uses common shipping routes
   - Perfect for testing without API calls

---

## 🐛 Troubleshooting

### Issue: "Permission denied" error
**Solution:** Ensure user role has access
- Analysts cannot update from AIS
- Only Operators/Admins can update positions

### Issue: "No AIS data available"
**Solution:** 
1. Check internet connection
2. Verify AIS sources are online
3. Check API rate limits
4. Falls back to mock data in debug mode

### Issue: "Invalid coordinates"
**Solution:**
- Latitude must be -90 to 90
- Longitude must be -180 to 180
- min_lat must be ≤ max_lat
- min_lon must be ≤ max_lon

### Issue: No vessels showing on map
**Solution:**
1. Verify API is returning data
2. Check browser console for errors
3. Ensure WebSocket is connected
4. Try refreshing the page

---

## 📈 Monitoring

### Check API Health
```bash
curl -X OPTIONS http://localhost:8000/api/vessels/realtime_positions/
# Should return 200 OK
```

### View Real-Time Logs
```bash
tail -f backend/logs/django.log
```

### Performance Metrics
- Response time: < 5 seconds
- Vessel count per area: 100-500
- Database queries: Optimized with indexing

---

## 🔐 Security

### Authentication
- JWT tokens (access + refresh)
- 15-minute access token expiry
- Refresh tokens for new access tokens

### Authorization
- Role-based access control (RBAC)
- Permission checks on all endpoints
- Audit logging for all operations

### CORS
- Configured for frontend domain
- Preflight requests supported
- HTTPS required in production

---

## 📚 Documentation Files

1. **REALTIME_API_UPDATED.md** - Detailed API specification
2. **REALTIME_API_IMPLEMENTATION_SUMMARY.md** - Implementation details
3. **REALTIME_TRACKING.md** - Original project documentation

---

## 🚢 Common Use Cases

### Use Case 1: Operator Tracking Fleet
```typescript
// Load all vessels globally
const response = await vesselService.getRealtimePositions();

// Load vessels in specific area
const response = await vesselService.getRealtimePositions(30, 50, -10, 10);

// Update single vessel from AIS
await vesselService.updateFromAIS(123);
```

### Use Case 2: Analyst Analyzing Traffic Patterns
```typescript
// Get fleet statistics
const stats = await vesselService.getFleetStatistics();

// Get analytics data
const analytics = await analyticsService.getAnalytics();

// View specific vessel track
const track = await vesselService.getVesselTrack(123, startDate, endDate);
```

### Use Case 3: Admin Bulk Import
```typescript
// Bulk update positions from AIS
await vesselService.bulkUpdatePositions(vesselDataArray);

// Manage users and permissions
await adminService.approveUser(userId);
```

---

## ✨ Key Features

✅ **Real-Time Updates** - Live vessel positions from AIS  
✅ **Multiple Data Sources** - Fallback chain for reliability  
✅ **Role-Based Access** - Operator, Analyst, Admin  
✅ **Interactive Maps** - Leaflet-based map visualization  
✅ **Comprehensive Analytics** - Fleet statistics & insights  
✅ **Secure Authentication** - JWT with refresh tokens  
✅ **Audit Logging** - Track all operations  
✅ **Error Handling** - Graceful failure with helpful messages  
✅ **Type Safety** - TypeScript frontend  
✅ **Production-Ready** - Comprehensive logging & monitoring  

---

## 📞 Support

For issues or questions:
1. Check the error message carefully
2. Review logs in `backend/logs/`
3. Check frontend console (F12)
4. Refer to detailed API documentation
5. Check sample API calls in this guide

---

**Last Updated:** January 6, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0

