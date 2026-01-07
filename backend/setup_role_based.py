#!/usr/bin/env python
"""
Setup role-based vessel visibility
Assigns first 15 vessels to operator
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maritime_project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from apps.vessels.models import Vessel, VesselAssignment

User = get_user_model()

def setup_assignments():
    """Create vessel assignments for role-based filtering"""
    
    print("\n" + "="*60)
    print("🚢 Setting up Role-Based Vessel Visibility")
    print("="*60)
    
    try:
        # Get users
        operator = User.objects.get(email='operator@test.com')
        admin_user = User.objects.get(email='admin@test.com')
        
        print(f"\n✓ Found operator: {operator.email}")
        print(f"✓ Found admin: {admin_user.email}")
        
        # Clear existing assignments
        old = VesselAssignment.objects.filter(user=operator).delete()[0]
        if old > 0:
            print(f"\n✓ Cleared {old} previous assignments")
        
        # Get vessels to assign
        vessels = Vessel.objects.filter(is_deleted=False)[:15]
        print(f"\n📊 Assigning vessels to operator...")
        
        # Create assignments
        for i, vessel in enumerate(vessels, 1):
            VesselAssignment.objects.create(
                user=operator,
                vessel=vessel,
                assigned_by=admin_user,
                assignment_reason='Regular tracking assignment',
                is_active=True
            )
            print(f"   {i:2d}. ✓ {vessel.vessel_name} (MMSI: {vessel.mmsi})")
        
        # Show summary
        total_vessels = Vessel.objects.filter(is_deleted=False).count()
        print(f"\n" + "="*60)
        print("✅ Setup Complete!")
        print("="*60)
        print(f"\n📊 Vessel Visibility by Role:")
        print(f"   • Operator:  {len(vessels)} assigned vessels")
        print(f"   • Analyst:   ALL {total_vessels} vessels")
        print(f"   • Admin:     ALL {total_vessels} vessels")
        
        print(f"\n🧪 Test the API:")
        print(f"   1. Login as operator/analyst/admin")
        print(f"   2. GET /api/vessels/realtime_positions/")
        print(f"   3. Operator sees {len(vessels)}, others see {total_vessels}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = setup_assignments()
    sys.exit(0 if success else 1)
