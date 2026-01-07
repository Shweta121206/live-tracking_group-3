# �� Vessel Search Flow - Visual Guide

## Problem → Solution Flow

```
┌─────────────────────────────────────────┐
│   Operator Searches for Vessel          │
│   /api/vessels/200000006/               │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Get vessel object  │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ Check: Is user an operator?    │
    └────────┬──────────┬────────────┘
             │          │
             YES        NO (Analyst/Admin)
             │          │
             ▼          ▼
    ┌─────────────────┐  ┌──────────────┐
    │ Check if vessel │  │ Return ALL   │
    │ is assigned     │  │ vessel data  │
    │ (in DB)         │  └──────────────┘
    └────────┬────────┘
             │
    ┌────────┴──────────┐
    │                   │
    YES (Assigned)      NO (Not Assigned)
    │                   │
    ▼                   ▼
┌──────────────┐   ┌────────────────────┐
│ Return ✅    │   │ Return 403 ❌       │
│ vessel data  │   │ "Not assigned"     │
│ 200 OK       │   │ Forbidden          │
└──────────────┘   └────────────────────┘
```

---

## Error Scenarios

### Scenario 1: Operator Finds Assigned Vessel ✅

```
REQUEST:
GET /api/vessels/1/
Authorization: Bearer <operator_token>

FLOW:
1. Vessel found (ID=1, OPAL_QUEEN)
2. User role = 'operator' → Check assignment
3. Assignment found in DB → Access granted
4. Return vessel data

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "id": 1,
    "mmsi": "219000606",
    "vessel_name": "OPAL_QUEEN",
    "latitude": 55.567,
    "longitude": 12.345,
    ...
  }
}
```

### Scenario 2: Operator Tries Unassigned Vessel ❌

```
REQUEST:
GET /api/vessels/999/
Authorization: Bearer <operator_token>

FLOW:
1. Vessel found (ID=999, UNKNOWN_SHIP)
2. User role = 'operator' → Check assignment
3. NO assignment in DB → Access denied
4. Return 403 error

RESPONSE (403 Forbidden):
{
  "success": false,
  "error": {
    "message": "You do not have access to this vessel",
    "details": "Vessel UNKNOWN_SHIP is not assigned to you"
  }
}
```

### Scenario 3: Analyst Views Any Vessel ✅

```
REQUEST:
GET /api/vessels/1/
Authorization: Bearer <analyst_token>

FLOW:
1. Vessel found (ID=1)
2. User role = 'analyst' → Skip assignment check
3. Return vessel data

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    ...vessel data...
  }
}
```

---

## Database Query Diagram

```
When Operator Accesses Vessel:

┌──────────────────────────────────────┐
│ Query VesselAssignment table         │
│ WHERE:                               │
│   user_id = <current_user_id>       │
│   vessel_id = <requested_vessel_id> │
│   is_active = TRUE                  │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   Found            Not Found
       │                │
       ▼                ▼
   ✅ Allow         ❌ Forbid
   (200 OK)       (403 Forbidden)
```

---

## API Endpoint Behavior

```
REALTIME POSITIONS:
GET /api/vessels/realtime_positions/

Operator Token → Returns 15 assigned vessels
Analyst Token  → Returns 33 all vessels
Admin Token    → Returns 33 all vessels

VESSEL LIST:
GET /api/vessels/

Operator Token → Returns 15 assigned vessels
Analyst Token  → Returns 33 all vessels
Admin Token    → Returns 33 all vessels

VESSEL DETAIL:
GET /api/vessels/{id}/

Operator Token → 200 if assigned, 403 if not
Analyst Token  → 200 for any vessel
Admin Token    → 200 for any vessel

VESSEL TRACK:
GET /api/vessels/{id}/track/

Operator Token → 200 if assigned, 403 if not
Analyst Token  → 200 for any vessel
Admin Token    → 200 for any vessel
```

---

## Step-by-Step: How Operator Can Find a Vessel

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: LOGIN                                            │
├─────────────────────────────────────────────────────────┤
│ POST /api/auth/login/                                   │
│ {"email": "operator@test.com", "password": "..."}      │
│ → Get: access_token                                     │
└──────────────┬────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: GET ASSIGNED VESSELS                             │
├─────────────────────────────────────────────────────────┤
│ GET /api/vessels/realtime_positions/                    │
│ Authorization: Bearer <token>                           │
│ → Returns 15 vessels with MMSI                          │
└──────────────┬────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: GET VESSEL LIST WITH IDs                         │
├─────────────────────────────────────────────────────────┤
│ GET /api/vessels/                                       │
│ Authorization: Bearer <token>                           │
│ → Returns list with ID, MMSI, Name                      │
│ Find the vessel you want                               │
└──────────────┬────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: VIEW VESSEL DETAILS                              │
├─────────────────────────────────────────────────────────┤
│ GET /api/vessels/{id}/                                  │
│ Authorization: Bearer <token>                           │
│ → Returns latitude, longitude, and other details        │
└──────────────┬────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: SHOW ON MAP                                      │
├─────────────────────────────────────────────────────────┤
│ Display vessel:                                         │
│   - Latitude & Longitude on Leaflet map               │
│   - Vessel name and MMSI                               │
│   - Speed, course, status                              │
│ ✅ Operator can now see vessel location!                │
└─────────────────────────────────────────────────────────┘
```

---

## Error Decision Tree

```
                    API Request
                         │
                    Vessel Found?
                    /          \
                  YES           NO
                   │             │
                   ▼             ▼
              Is Operator?    Return 404
              /      \
            YES       NO
             │        │
             ▼        ▼
        Has Assignment?  Return 200
        /        \
      YES        NO
       │         │
       ▼         ▼
    Return   Return 403
    200 OK   Forbidden
```

---

## Complete Workflow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                   OPERATOR VESSEL SEARCH FLOW                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Opens Map                                                    │
│         │                                                          │
│         ▼                                                          │
│  Browser calls: GET /api/vessels/realtime_positions/             │
│  (Shows 15 assigned vessel markers on map)                        │
│         │                                                          │
│         ▼                                                          │
│  User clicks on marker or searches for vessel                    │
│         │                                                          │
│         ▼                                                          │
│  Browser calls: GET /api/vessels/{id}/                           │
│         │                                                          │
│    ┌────┴────┐                                                   │
│    │          │                                                   │
│    YES (Assigned)  NO (Unassigned)                              │
│    │          │                                                   │
│    ▼          ▼                                                   │
│  Shows      Shows error:                                         │
│  Details    "Not assigned to you"                               │
│  Location   Suggest asking admin                                │
│  Track      to assign vessel                                    │
│    │          │                                                   │
│    └────┬─────┘                                                  │
│         │                                                          │
│         ▼                                                          │
│  ✅ Operator can find and view vessel location!                  │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## Summary

✅ **Before Fix:**
- Operator gets confusing "No matches" error
- Can't view any vessel details clearly

✅ **After Fix:**
- Operator sees 15 assigned vessels clearly
- Can view details of assigned vessels
- Gets helpful error for unassigned vessels
- Can locate vessels on map with precise coordinates

