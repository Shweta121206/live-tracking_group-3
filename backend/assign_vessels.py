#!/usr/bin/env python
"""
Assign vessels to operator for role-based filtering
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maritime_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.vessels.models import Vessel, VesselAssignment

User = get_user_model()

print("🚢 Assigning vessels to operator...")

try:
    operator = User.objects.get(email='operator@test.com')
    admin_user = User.objects.get(email='admin@test.com')
    
    # Clear existing assignments
    old_count = VesselAssignment.objects.filter(user=operator).count()
    VesselAssignment.objects.filter(user=operator).delete()
    print(f"✓ Cleared {old_count} previous assignments")
    
    # Get first 15 vessels for operator to track
    vessels_to_assign = Vessel.objects.filter(is_deleted=False)[:15]
    assignment_count = 0
    
    for vessel in vessels_to_assign:
        assignment, created = VesselAssignment.objects.get_or_create(
            user=operator,
            vessel=vessel,
            defaults={
                'assigned_by': admin_user,
                'assignment_reason': 'Regular tracking assignment',
                'is_active': True
            }
        )
        if created:
            assignment_count += 1
            print(f"  ✓ {vessel.vessel_name} assigned to operator")
    
    total_vessels = Vessel.objects.filter(is_deleted=False).count()
    print(f"\n✅ Complete!")
    print(f"  • Operator: sees {assignment_count} assigned vessels")
    print(f"  • Analyst: sees ALL {total_vessels} vessels")
    print(f"  • Admin: sees ALL {total_vessels} vessels")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
