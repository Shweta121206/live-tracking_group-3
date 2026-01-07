#!/usr/bin/env python
"""
Initialize database with test data and vessel assignments
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maritime_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from apps.vessels.models import Vessel, VesselAssignment

User = get_user_model()

print("=" * 60)
print("Initializing test data...")
print("=" * 60)

# Create test users
users_data = [
    {
        'email': 'operator@test.com',
        'first_name': 'John',
        'last_name': 'Operator',
        'role': 'operator',
        'password': 'Test1234!'
    },
    {
        'email': 'analyst@test.com',
        'first_name': 'Jane',
        'last_name': 'Analyst',
        'role': 'analyst',
        'password': 'Test1234!'
    },
    {
        'email': 'admin@test.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'admin',
        'password': 'Test1234!'
    }
]

print("\n1. Creating test users...")
operator = None
for user_data in users_data:
    email = user_data['email']
    try:
        user = User.objects.get(email=email)
        print(f"   ✓ {email} (already exists)")
        if email == 'operator@test.com':
            operator = user
    except User.DoesNotExist:
        user = User.objects.create_user(**user_data)
        user.is_verified = True
        user.save()
        print(f"   ✓ {email} created")
        if email == 'operator@test.com':
            operator = user

# Generate tokens for testing
print("\n2. Generating authentication tokens...")
for email in ['operator@test.com', 'analyst@test.com', 'admin@test.com']:
    user = User.objects.get(email=email)
    refresh = RefreshToken.for_user(user)
    print(f"\n   User: {email}")
    print(f"   Token: {str(refresh.access_token)[:50]}...")

# Create test vessels if none exist
print("\n3. Checking vessels...")
vessel_count = Vessel.objects.filter(is_deleted=False).count()
print(f"   Vessels in database: {vessel_count}")

if vessel_count == 0:
    print("   Creating sample vessels...")
    vessels_data = [
        {
            'vessel_name': 'OPAL QUEEN',
            'mmsi': '219000606',
            'vessel_type': 'Cargo',
            'latitude': 55.567,
            'longitude': 12.345,
            'speed_over_ground': 12.3,
            'course_over_ground': 245.0,
            'heading': 244,
            'status': 'underway',
            'is_tracked': True,
        },
        {
            'vessel_name': 'NORDIC EXPLORER',
            'mmsi': '219000607',
            'vessel_type': 'Container',
            'latitude': 40.712776,
            'longitude': -74.005974,
            'speed_over_ground': 15.5,
            'course_over_ground': 180.0,
            'heading': 180,
            'status': 'underway',
            'is_tracked': True,
        },
        {
            'vessel_name': 'MARINE TRADER',
            'mmsi': '219000608',
            'vessel_type': 'Tanker',
            'latitude': 35.689499,
            'longitude': 139.691711,
            'speed_over_ground': 10.2,
            'course_over_ground': 90.0,
            'heading': 90,
            'status': 'moored',
            'is_tracked': True,
        },
    ]
    
    for vessel_data in vessels_data:
        vessel = Vessel.objects.create(**vessel_data)
        print(f"   ✓ {vessel.vessel_name} created")

# Assign vessels to operator
print("\n4. Assigning vessels to operator...")
operator = User.objects.get(email='operator@test.com')
admin_user = User.objects.get(email='admin@test.com')

# Clear existing assignments
VesselAssignment.objects.filter(user=operator).delete()

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

print(f"   ✓ Operator assigned to {assignment_count} vessels")
print(f"   ✓ Analyst can see ALL {Vessel.objects.filter(is_deleted=False).count()} vessels")
print(f"   ✓ Admin can see ALL {Vessel.objects.filter(is_deleted=False).count()} vessels")

print("\n" + "=" * 60)
print("Initialization complete!")
print("=" * 60)
print("\n✅ ROLE-BASED VESSEL VISIBILITY:")
print("   • Operator: sees 15 assigned vessels")
print("   • Analyst: sees ALL vessels")
print("   • Admin: sees ALL vessels")
print("\nYou can now test the API:")
print("  curl -H 'Authorization: Bearer <token>' http://localhost:8000/api/vessels/realtime_positions/")
