# 🚀 QUICK REFERENCE - Commands & Documentation

---

## ⚡ 30-Second Setup

```bash
# 1. Apply database changes
cd backend && python3 manage.py migrate

# 2. Create vessel assignments
python3 setup_role_based.py

# 3. Test in browser
# Open http://localhost:3000
# Login as operator@test.com / Test1234!
# See 15 vessels on map (not 33!)
```

---

## 📚 Documentation Files (In Order)

### 1. **EXECUTION_SUMMARY.md** ← START HERE
- Overview of problem and solution
- Before/after comparison
- Implementation checklist
- Quick test procedures

### 2. **QUICK_SETUP_ROLE_VISIBILITY.md**
- 30-second setup instructions
- Expected results
- Basic verification steps
- Troubleshooting

### 3. **OPERATOR_VS_ADMIN_FIXED.md**
- Complete problem description
- Detailed solution explanation
- Step-by-step setup guide
- Full testing procedures

### 4. **ROLE_BASED_VESSEL_VISIBILITY.md**
- Comprehensive implementation guide
- All features explained
- Advanced configuration
- Management operations

### 5. **CODE_CHANGES_REFERENCE.md**
- Complete code listings
- All files modified/created
- Code quality notes
- Database schema

### 6. **ARCHITECTURE_DIAGRAMS.md**
- Visual flow diagrams
- Before/after comparison
- Database relationships
- Query performance analysis

---

## 🧪 Test Commands

### Quick Verification
```bash
# Check migration was applied
cd backend
python3 manage.py showmigrations vessels | grep 0002

# Check assignments were created
python3 manage.py shell
>>> from apps.vessels.models import VesselAssignment
>>> VesselAssignment.objects.count()
15  # Should return 15
>>> exit()
```

### API Tests (Requires curl + jq)
```bash
# Operator: Should see 15 vessels
OP_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@test.com","password":"Test1234!"}' \
  | jq -r '.data.access_token')
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer $OP_TOKEN" | jq '.data.count'
# Output should be: 15

# Analyst: Should see 33 vessels
AN_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@test.com","password":"Test1234!"}' \
  | jq -r '.data.access_token')
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer $AN_TOKEN" | jq '.data.count'
# Output should be: 33

# Admin: Should see 33 vessels
AD_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}' \
  | jq -r '.data.access_token')
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer $AD_TOKEN" | jq '.data.count'
# Output should be: 33
```

### Browser Testing
1. Open: http://localhost:3000
2. Login as: operator@test.com / Test1234!
3. Go to: Map View
4. Count: Should see 15 vessel markers
5. Try as: analyst@test.com / Test1234!
6. Count: Should see 33 vessel markers

---

## 🔧 Management Commands

### View Assignments
```bash
cd backend
python3 manage.py shell

from apps.vessels.models import VesselAssignment
from django.contrib.auth import get_user_model

User = get_user_model()

# View operator's assignments
op = User.objects.get(email='operator@test.com')
assignments = VesselAssignment.objects.filter(user=op, is_active=True)
for a in assignments:
    print(f"{a.vessel.vessel_name} (MMSI: {a.vessel.mmsi})")
```

### Add New Assignment
```bash
cd backend
python3 manage.py shell

from apps.vessels.models import Vessel, VesselAssignment
from django.contrib.auth import get_user_model

User = get_user_model()
op = User.objects.get(email='operator@test.com')
admin = User.objects.get(email='admin@test.com')
vessel = Vessel.objects.get(mmsi='219000610')

VesselAssignment.objects.create(
    user=op,
    vessel=vessel,
    assigned_by=admin,
    assignment_reason='New patrol zone',
    is_active=True
)
```

### Deactivate Assignment
```bash
cd backend
python3 manage.py shell

from apps.vessels.models import VesselAssignment
from django.contrib.auth import get_user_model

User = get_user_model()
op = User.objects.get(email='operator@test.com')

assignment = VesselAssignment.objects.get(
    user=op,
    vessel__mmsi='219000606'
)
assignment.is_active = False
assignment.save()
```

### Remove Assignment
```bash
cd backend
python3 manage.py shell

from apps.vessels.models import VesselAssignment
from django.contrib.auth import get_user_model

User = get_user_model()
op = User.objects.get(email='operator@test.com')

VesselAssignment.objects.filter(
    user=op,
    vessel__mmsi='219000606'
).delete()
```

### Reset All Assignments
```bash
cd backend
python3 manage.py shell

from apps.vessels.models import VesselAssignment
VesselAssignment.objects.all().delete()
print("All assignments deleted")

# Then run setup again
exit()
python3 setup_role_based.py
```

---

## 📊 Important Vessel MMSIs

Used in test assignments (first 15):
```
219000606  - OPAL_QUEEN
219000607  - NORDIC_EXPLORER
219000608  - MARINE_TRADER
219000609  - BALTIC_OPERATOR
219000610  - NORTH_SEA_VESSEL
219000611  - ATLANTIC_CARRIER
219000612  - MEDITERRANEAN_TRADER
219000613  - INDO_PACIFIC_VESSEL
219000614  - ARCTIC_EXPLORER
219000615  - SOUTHERN_OCEAN
219000616  - CARIBBEAN_TRADER
219000617  - SUEZ_EXPRESS
219000618  - PANAMA_ROUTE
219000619  - ASIAN_NAVIGATOR
219000620  - GLOBAL_TRADER
```

---

## 🔐 Test User Credentials

| Email | Password | Role | Vessels |
|-------|----------|------|---------|
| operator@test.com | Test1234! | operator | 15 assigned |
| analyst@test.com | Test1234! | analyst | 33 (all) |
| admin@test.com | Test1234! | admin | 33 (all) |

---

## 📍 API Endpoints

### Get Real-Time Vessels
```
GET /api/vessels/realtime_positions/
Authorization: Bearer <token>

Query Parameters (optional):
  ?min_lat=-90&max_lat=90&min_lon=-180&max_lon=180

Response:
{
  "success": true,
  "data": {
    "vessels": [...],
    "count": 15 (for operator) or 33 (for others),
    "filtered": true/false,
    "source": "aishub_free"
  }
}
```

### Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "operator@test.com",
  "password": "Test1234!"
}

Response:
{
  "success": true,
  "data": {
    "access_token": "eyJ0...",
    "refresh_token": "eyJ0...",
    "user": {"email": "operator@test.com", "role": "operator"}
  }
}
```

---

## 🆘 Troubleshooting

### Issue: Operator still sees 33 vessels
```bash
# Solution: Re-run setup
cd backend
python3 setup_role_based.py
```

### Issue: Migration not applied
```bash
# Solution: Check and apply manually
cd backend
python3 manage.py showmigrations vessels
# If 0002 shows "[ ]", apply it:
python3 manage.py migrate vessels
```

### Issue: No assignments in database
```bash
# Solution: Create assignments
cd backend
python3 setup_role_based.py
```

### Issue: 403 Forbidden errors
```bash
# Solution: Check token is valid
# Make sure Authorization header has: Bearer <token>
# Tokens expire - get new one by logging in again
```

### Issue: Map shows no vessels
```bash
# Solution: Check browser console (F12)
# Check Network tab for API response
# Verify token in localStorage: 
#   Application > LocalStorage > access_token
```

---

## 📈 File Modifications Summary

| File | Type | Change |
|------|------|--------|
| **models.py** | Modified | Added VesselAssignment class (~40 lines) |
| **views.py** | Modified | Added filtering logic (~15 lines) |
| **setup_role_based.py** | Created | Assignment script |
| **Migration 0002** | Created | Auto-generated by Django |

**Total Code Added:** ~60 lines (excluding documentation)

---

## ✅ Deployment Checklist

- [ ] Code reviewed
- [ ] Database migration applied: `python3 manage.py migrate`
- [ ] Setup script run: `python3 setup_role_based.py`
- [ ] Test operator (15 vessels)
- [ ] Test analyst (33 vessels)
- [ ] Test admin (33 vessels)
- [ ] Frontend shows correct count
- [ ] No errors in backend logs
- [ ] No errors in browser console
- [ ] Ready for production

---

## 📞 Support Resources

1. **Documentation:**
   - EXECUTION_SUMMARY.md - Overview
   - QUICK_SETUP_ROLE_VISIBILITY.md - Quick start
   - OPERATOR_VS_ADMIN_FIXED.md - Complete guide
   - ROLE_BASED_VESSEL_VISIBILITY.md - Detailed reference
   - CODE_CHANGES_REFERENCE.md - Code details
   - ARCHITECTURE_DIAGRAMS.md - Visual guides

2. **Commands:**
   - `python3 manage.py showmigrations` - Check migrations
   - `python3 manage.py shell` - Interactive Django shell
   - `curl` commands above - API testing

3. **Logs:**
   - Backend: `tail -f backend/logs/*`
   - Browser console: F12 in browser

---

## 🎯 Quick Status

✅ **Problem:** Operator and Admin saw same vessels  
✅ **Solution:** VesselAssignment model with role-based filtering  
✅ **Implementation:** Complete in 3 files + migration  
✅ **Testing:** Ready with provided commands  
✅ **Documentation:** 6 comprehensive guides  
✅ **Deployment:** Ready for production  

---

**Next Step:** Run `python3 backend/setup_role_based.py` 🚀
