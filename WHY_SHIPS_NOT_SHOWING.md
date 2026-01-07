# Why Ships Are Not Showing - ROOT CAUSE & SOLUTION

## Root Cause Analysis

### The Problem
Frontend shows no vessel data even though backend API exists.

### Why This Happens

1. **❌ User Not Authenticated**
   - Frontend requires JWT authentication tokens
   - Without token, API returns 401 Unauthorized
   - MapView component cannot display data

2. **❌ No Login Credentials**
   - Test users exist in database (operator@test.com, etc.)
   - But frontend user doesn't know about them
   - Frontend starts with empty authenticated state

3. **✅ Backend IS Working**
   - Database has 33 vessels ready to display
   - API endpoints are functional
   - Returning correct data structure

---

## The Solution (Step by Step)

### Step 1: Verify Backend Status

```bash
# Check backend is running
curl http://localhost:8000/api/ -v
# Should return 401 (that's correct - means it's running but needs auth)
```

**Expected Output:**
```
< HTTP/1.1 401 Unauthorized
```

### Step 2: Login to Get Authentication Token

**Option A: Via Frontend (Recommended)**
1. Go to http://localhost:3000
2. Click "Login"
3. Enter:
   - Email: `operator@test.com`
   - Password: `Test1234!`
4. Click Login
5. You'll be redirected to Dashboard with vessels showing

**Option B: Via API (For Testing)**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@test.com",
    "password": "Test1234!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAi...",
    "user": {
      "email": "operator@test.com",
      "role": "operator"
    }
  }
}
```

### Step 3: Frontend Receives Token

When you login via frontend:
1. Frontend receives `access_token` and `refresh_token`
2. Tokens are stored in browser's localStorage
3. All API calls now include: `Authorization: Bearer <token>`

### Step 4: Now Ships Will Show

Once authenticated:
- **MapView**: Shows interactive map with vessel markers
- **OperatorDashboard**: Shows fleet statistics
- **Analytics**: Shows vessel insights (Analyst role)

---

## Test Credentials

All users have password: `Test1234!`

| Email | Role | Can Do |
|-------|------|--------|
| operator@test.com | Operator | View map, Update positions |
| analyst@test.com | Analyst | View analytics, Reports |
| admin@test.com | Admin | Everything |

---

## Verify It's Working

### Check 1: Backend Database

```bash
cd backend
python3 manage.py shell
>>> from apps.vessels.models import Vessel
>>> Vessel.objects.filter(is_deleted=False).count()
33  # ✓ Should show 33 vessels
```

### Check 2: API Response

```bash
# Get token first
TOKEN="<paste_access_token_from_login>"

# Call API
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer $TOKEN"

# ✓ Should return vessel data
```

### Check 3: Frontend

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Check **LocalStorage**
4. Look for:
   - ✓ `access_token` key
   - ✓ `refresh_token` key
   - ✓ `user` key (with email and role)

5. Go to **Network** tab
6. Click on `realtime_positions` request
7. Check Response tab - should see vessel data

---

## Complete Setup Checklist

- [ ] Backend running: `cd backend && python3 manage.py runserver`
- [ ] Frontend running: `cd frontend && npm start`
- [ ] Database initialized: `cd backend && python3 init_data.py` (if fresh install)
- [ ] User logged in via http://localhost:3000
- [ ] MapView shows vessels with markers
- [ ] Clicking markers shows vessel details

---

## If Ships STILL Don't Show

### Debug Steps

1. **Check Browser Console (F12)**
   ```
   - Any red errors?
   - Network request failing?
   - 401 Unauthorized responses?
   ```

2. **Check Login Status**
   - Open DevTools → Application → LocalStorage
   - Is `access_token` present?
   - Is it not empty?

3. **Check Network Requests**
   - Open DevTools → Network tab
   - Look for `/realtime_positions/` request
   - Check Response tab for vessel data
   - Check if Authorization header is sent

4. **Restart Everything**
   ```bash
   # Kill all Node and Python processes
   pkill -f "python3 manage.py"
   pkill -f "npm start"
   
   # Start fresh
   cd backend && python3 manage.py runserver &
   cd frontend && npm start &
   ```

5. **Reset Database** (Last Resort)
   ```bash
   cd backend
   rm db.sqlite3
   python3 manage.py migrate
   python3 init_data.py
   ```

---

## Architecture Overview

```
┌─ Browser (localhost:3000) ─┐
│                            │
│  MapView Component          │ 1. User logs in
│  ├─ Calls vesselService    │ 2. Receives access_token
│  │  └─ getRealtimePositions()
│  │     └─ Includes token in Authorization header
│  │                          
│  └─ Displays vessel markers │ 3. Frontend has token
│                             │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
          ↓
   HTTP Request with Authorization header
          ↓
┌─ Backend (localhost:8000) ─┐
│                            │
│  Django REST API           │ 4. Backend validates token
│  │  ├─ /api/auth/login/    │
│  │  ├─ /api/vessels/       │
│  │  └─ /api/vessels/       │
│  │     realtime_positions/│
│  │                        │
│  └─ SQLite Database       │ 5. Returns 33 vessels
│     (backend/db.sqlite3) │
│     ├─ 33 Vessels        │
│     └─ 3 Users          │
│                            │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
          ↓
   HTTP Response (JSON with vessels)
          ↓
   Frontend renders on map
```

---

## Working Example Flow

```
User Action              Backend Response              Frontend Display
────────────────────────────────────────────────────────────────────────

1. Opens http://localhost:3000
   → No token yet
   → Redirect to /login

2. Enters credentials
   operator@test.com
   Test1234!
   
   → POST /api/auth/login/  → 200 OK + access_token      → Store token
                                                            → Redirect to /dashboard

3. Views MapView page
   → GET /api/vessels/realtime_positions/  → 200 OK + 33 vessels  → Render map with markers
      (sends Authorization header)

4. Clicks on vessel marker
   → GET /api/vessels/{id}/  → 200 OK + vessel details  → Show popup
```

---

## Summary

**Why ships weren't showing:**
- Frontend had no authentication token
- Without token, API returns 401
- No data could be displayed

**How to fix it:**
1. Ensure backend is running
2. Ensure frontend is running
3. Login with provided credentials
4. Tokens are automatically stored
5. Ships appear on the map

**The System is Working!** ✓
- Backend: ✓ Running and serving data
- Database: ✓ Has 33 vessels
- API: ✓ Functional and secured
- Frontend: ✓ Waiting for authentication

**Next Action:** Login to http://localhost:3000 with operator@test.com

