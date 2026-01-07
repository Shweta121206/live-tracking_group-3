# 🎯 Role-Based Vessel Visibility - IMPLEMENTATION COMPLETE

## ✅ Problem Solved

**Issue:** Operator and Admin were seeing the same vessels on the map  
**Solution:** Implemented role-based vessel visibility with VesselAssignment model

---

## 📋 Changes Made

### 1. **New Database Model: VesselAssignment**
**Location:** `backend/apps/vessels/models.py`

```python
class VesselAssignment(TimeStampedModel):
    """
    Assigns vessels to operators/users for tracking
    Operators see only their assigned vessels on the map
    Analysts and Admins see all vessels
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vessel = models.ForeignKey(Vessel, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
```

**Features:**
- Links users to vessels they should track
- `is_active` flag to enable/disable assignments
- `assigned_by` for audit trail (who assigned the vessel)
- Unique constraint: One user can only be assigned to each vessel once

### 2. **Updated API Endpoint: realtime_positions**
**Location:** `backend/apps/vessels/views.py` (Lines 345-422)

**New Role-Based Logic:**

```
OPERATOR → Sees ONLY assigned vessels (filtered by VesselAssignment)
ANALYST  → Sees ALL vessels (no filtering)
ADMIN    → Sees ALL vessels (no filtering)
```

**Implementation:**
```python
if request.user.role == 'operator':
    # Filter to only assigned vessels
    assigned_mmsi = set(
        VesselAssignment.objects.filter(
            user=request.user,
            is_active=True
        ).values_list('vessel__mmsi', flat=True)
    )
    vessels = [v for v in vessels if v.get('mmsi') in assigned_mmsi]
else:
    # Analysts and Admins see all vessels
    pass
```

### 3. **Database Migration**
**File:** `backend/apps/vessels/migrations/0002_vesselassignment.py`

Applied successfully:
```
✓ Applying vessels.0002_vesselassignment... OK
```

---

## 🚀 How to Enable Role-Based Visibility

### Step 1: Create Vessel Assignments

Run this in Django shell:

```bash
cd backend
python3 manage.py shell
```

Then in the shell:

```python
from django.contrib.auth import get_user_model
from apps.vessels.models import Vessel, VesselAssignment

User = get_user_model()

# Get users
operator = User.objects.get(email='operator@test.com')
admin_user = User.objects.get(email='admin@test.com')

# Clear any existing assignments
VesselAssignment.objects.filter(user=operator).delete()

# Assign first 15 vessels to operator
vessels = Vessel.objects.filter(is_deleted=False)[:15]
for vessel in vessels:
    VesselAssignment.objects.create(
        user=operator,
        vessel=vessel,
        assigned_by=admin_user,
        assignment_reason='Regular tracking assignment',
        is_active=True
    )

print(f"✅ Assigned {vessels.count()} vessels to operator")
```

### Step 2: Quick Assignment Script

**Alternative:** Save as `assign_vessels.py`:

```python
#!/usr/bin/env python
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maritime_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.vessels.models import Vessel, VesselAssignment

User = get_user_model()
op = User.objects.get(email='operator@test.com')
adm = User.objects.get(email='admin@test.com')

VesselAssignment.objects.filter(user=op).delete()
for v in Vessel.objects.filter(is_deleted=False)[:15]:
    VesselAssignment.objects.create(
        user=op, vessel=v, assigned_by=adm, 
        assignment_reason='Tracking'
    )

print('✅ 15 vessels assigned to operator')
```

Run it:
```bash
python3 assign_vessels.py
```

---

## 🧪 Testing Role-Based Visibility

### Test 1: Operator vs Admin

**Operator Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@test.com","password":"Test1234!"}'
```

Store the `access_token`, then test:
```bash
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer <operator_token>"
```

**Expected Result:** Shows only ~15 vessels (the assigned ones)

**Admin Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}'
```

Test:
```bash
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Result:** Shows ALL 33 vessels

### Test 2: Analyst (Same as Admin)

**Analyst Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@test.com","password":"Test1234!"}'
```

Test:
```bash
curl "http://localhost:8000/api/vessels/realtime_positions/" \
  -H "Authorization: Bearer <analyst_token>"
```

**Expected Result:** Shows ALL 33 vessels (analysts can see everything)

---

## 📊 Expected Behavior After Implementation

| Role | Vessels Visible | Can Update | Permissions |
|------|-----------------|-----------|------------|
| **Operator** | 15 assigned | ✅ Yes | Track assigned vessels |
| **Analyst** | ALL 33 | ❌ No | View all, no edit |
| **Admin** | ALL 33 | ✅ Yes | Full access |

---

## 📱 Frontend Changes

**No frontend code changes required!** The frontend already:
- ✅ Handles variable vessel counts
- ✅ Displays whatever the API returns
- ✅ Filters valid coordinates
- ✅ Shows user role in response

The response now includes:
```json
{
  "success": true,
  "data": {
    "vessels": [...],
    "count": 15,  // Different for each role!
    "user_role": "operator",
    "filtered": true  // Indicates role-based filtering
  }
}
```

---

## 📝 Database Changes

### New Table: `vessel_assignments`

```sql
CREATE TABLE vessel_assignments (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  vessel_id BIGINT NOT NULL,
  assigned_by_id BIGINT,
  assignment_reason VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  
  UNIQUE(user_id, vessel_id),
  FOREIGN KEY(user_id) REFERENCES auth_user(id),
  FOREIGN KEY(vessel_id) REFERENCES vessels(id),
  FOREIGN KEY(assigned_by_id) REFERENCES auth_user(id)
);
```

**Indexes:**
- `user_id, is_active` - for efficient role-based filtering
- `vessel_id, is_active` - for reverse lookups

---

## 🔧 Managing Assignments

### Add Assignment (Admin/Operator)
```python
from apps.vessels.models import VesselAssignment
VesselAssignment.objects.create(
    user=operator_user,
    vessel=vessel,
    assigned_by=admin_user,
    assignment_reason='Regular tracking',
    is_active=True
)
```

### Deactivate Assignment
```python
assignment = VesselAssignment.objects.get(user=operator, vessel=vessel)
assignment.is_active = False
assignment.save()
```

### List Operator's Assignments
```python
assignments = VesselAssignment.objects.filter(
    user=operator_user,
    is_active=True
).select_related('vessel')

for assignment in assignments:
    print(f"{assignment.vessel.vessel_name}")
```

### Remove Assignment
```python
VesselAssignment.objects.filter(user=operator, vessel=vessel).delete()
```

---

## 🐛 Troubleshooting

### Operator sees no vessels
**Cause:** No assignments created yet  
**Fix:** Run assignment script above

### Operator sees wrong vessels
**Cause:** Assignments don't match vessel data  
**Fix:** Check vessel MMSIs match

### API returns empty for analyst
**Cause:** Database or AIS service issue  
**Fix:** Check if vessels exist in database

### All roles see same vessels
**Cause:** Filtering not applied  
**Fix:** 
- Verify migration ran: `python3 manage.py showmigrations vessels`
- Check code in views.py line 370-380
- Restart Django server

---

## ✨ Advanced Features

### Time-Limited Assignments
```python
from datetime import timedelta
from django.utils import timezone

VesselAssignment.objects.create(
    user=operator,
    vessel=vessel,
    assigned_by=admin,
    is_active=True,
    expires_at=timezone.now() + timedelta(days=30)  # 30-day assignment
)
```

### Deactivate Expired Assignments
```python
from django.utils import timezone

VesselAssignment.objects.filter(
    expires_at__lt=timezone.now(),
    is_active=True
).update(is_active=False)
```

### Assignment Audit Trail
```python
# Who assigned this vessel to this operator?
assignment = VesselAssignment.objects.get(user=operator, vessel=vessel)
print(f"Assigned by: {assignment.assigned_by.email}")
print(f"Reason: {assignment.assignment_reason}")
print(f"Date: {assignment.assigned_at}")
```

---

## 📈 Impact

✅ **Security:** Each operator sees only their vessels  
✅ **Scalability:** Works with any number of vessels  
✅ **Flexibility:** Easy to add/remove assignments  
✅ **Audit:** Tracks who assigned what and when  
✅ **Performance:** Efficient queries with proper indexes

---

## 🎉 Summary

**Before:** Operator and Admin saw the same 33 vessels  
**After:** 
- Operator: 15 assigned vessels
- Analyst: 33 vessels
- Admin: 33 vessels

All changes deployed and ready to test! 🚀
