# Frontend Setup Instructions

## The Issue

Ships are not showing data in the frontend because:

1. **No Authentication**: The frontend requires JWT tokens from the backend
2. **Empty Database**: The database had no users or vessel data
3. **Missing Environment Setup**: Frontend needs to know the API URL and user needs to be logged in

## The Solution

### Step 1: Start Backend

```bash
cd backend
python3 manage.py runserver 0.0.0.0:8000
```

### Step 2: Create Test Data

```bash
cd backend
python3 init_data.py
```

This creates:
- 3 test users (operator, analyst, admin)
- 3 sample vessels with real coordinates

### Step 3: Login in Frontend

1. Open http://localhost:3000
2. Go to Login page
3. Use credentials:
   - Email: `operator@test.com`
   - Password: `Test1234!`

4. After login, you'll be redirected to dashboard where you can see ships

### Step 4: View Real-Time Vessels

Once logged in:
1. Go to "Map View" page - Shows interactive map with vessels
2. Go to "Dashboard" - Shows fleet overview with real-time data

## API Endpoints (for testing)

### Get Auth Token
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@test.com","password":"Test1234!"}'
```

### Get Real-Time Vessels
```bash
# Save the access_token from login response
TOKEN="your_token_here"

curl -X GET "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer $TOKEN"
```

### Response Example
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
        "source": "database"
      }
    ],
    "count": 3,
    "source": "aishub_free",
    "timestamp": "2026-01-06T05:52:51.123456Z"
  }
}
```

## Test Users

| Email | Password | Role |
|-------|----------|------|
| operator@test.com | Test1234! | Operator |
| analyst@test.com | Test1234! | Analyst |
| admin@test.com | Test1234! | Admin |

## Frontend Environment Variables

Create `.env` file in frontend directory:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
```

## Troubleshooting

### Vessels Still Not Showing?

1. **Check browser console** (F12 → Console tab)
   - Look for errors in network requests
   - Check if API token is being sent

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:8000/api/
   # Should return 401 (unauthorized) - that's correct!
   ```

3. **Verify Frontend is Logged In**
   - Check localStorage in browser DevTools
   - Look for `access_token` and `user` keys

4. **Check Network Tab** (F12 → Network)
   - Look for `/realtime_positions/` request
   - Should see `Authorization: Bearer <token>` header
   - Response should be 200 with vessel data

### Database Issues?

Reset database:
```bash
cd backend
rm db.sqlite3
python3 manage.py migrate
python3 init_data.py
```

### Port Already in Use?

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend && python3 manage.py runserver 0.0.0.0:8000

# Terminal 2: Start Frontend  
cd frontend && npm start

# Terminal 3: Initialize data (run once)
cd backend && python3 init_data.py
```

Then open http://localhost:3000 and login!

