from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import User, Follow, DeviceToken
from apps.notifications.services import send_push_notification
from .serializers import UserSerializer, UserRegisterSerializer, FollowSerializer, UserUpdateSerializer, DeviceTokenSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'


class UserSearchView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']


class FollowToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        if target == request.user:
            return Response({"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if not created:
            follow.delete()
            return Response({"detail": "Unfollowed."}, status=status.HTTP_200_OK)
        send_push_notification(
            target,
            title=f"{request.user.username} started following you",
            body="Check out their profile!",
            data={"type": "follow", "user_id": str(request.user.id)},
            notification_type='follow',
            sender=request.user,
        )
        return Response({"detail": "Followed."}, status=status.HTTP_201_CREATED)


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Follow.objects.filter(following=user)


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Follow.objects.filter(follower=user)


class DeviceTokenRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        DeviceToken.objects.update_or_create(
            user=request.user,
            token=serializer.validated_data['token'],
            defaults={'platform': serializer.validated_data.get('platform', 'android')}
        )
        return Response({"detail": "Token registered."}, status=status.HTTP_201_CREATED)


class DeviceTokenUnregisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Token required."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.device_tokens.filter(token=token).delete()
        return Response({"detail": "Token unregistered."}, status=status.HTTP_200_OK)
