import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'maritime_project.settings'
django.setup()
from django.contrib.auth import get_user_model
from apps.vessels.models import Vessel, VesselAssignment
User = get_user_model()
op = User.objects.get(email='operator@test.com')
adm = User.objects.get(email='admin@test.com')
VesselAssignment.objects.filter(user=op).delete()
for v in Vessel.objects.filter(is_deleted=False)[:15]:
    VesselAssignment.objects.create(user=op, vessel=v, assigned_by=adm, assignment_reason='Tracking')
print('✅ Assigned 15 vessels to operator')
