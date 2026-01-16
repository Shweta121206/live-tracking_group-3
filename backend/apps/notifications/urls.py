from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import NotificationViewSet, NotificationSettingsViewSet, UserPreferencesViewSet

router = SimpleRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('settings/notifications/', NotificationSettingsViewSet.as_view({
        'get': 'list',
        'put': 'update'
    }), name='notification-settings'),
    path('settings/preferences/', UserPreferencesViewSet.as_view({
        'get': 'list',
        'put': 'update'
    }), name='user-preferences'),
]
