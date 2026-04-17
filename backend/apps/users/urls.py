from django.urls import path
from .views import (
    RegisterView, MeView, UserProfileView, UserSearchView,
    FollowToggleView, FollowersListView, FollowingListView,
    DeviceTokenRegisterView, DeviceTokenUnregisterView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('profile/<str:username>/', UserProfileView.as_view(), name='user-profile'),
    path('<int:user_id>/follow/', FollowToggleView.as_view(), name='follow-toggle'),
    path('<int:user_id>/followers/', FollowersListView.as_view(), name='followers-list'),
    path('<int:user_id>/following/', FollowingListView.as_view(), name='following-list'),
    path('device-tokens/register/', DeviceTokenRegisterView.as_view(), name='device-token-register'),
    path('device-tokens/unregister/', DeviceTokenUnregisterView.as_view(), name='device-token-unregister'),
]
