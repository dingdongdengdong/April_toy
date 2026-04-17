from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions, parsers, status
from rest_framework.response import Response
from .models import Story
from .serializers import StorySerializer, StoryCreateSerializer


class StoryListCreateView(generics.ListCreateAPIView):
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list('following_id', flat=True)
        now = timezone.now()
        return Story.objects.filter(
            user_id__in=following_ids,
            expires_at__gt=now
        ).select_related('user').order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = StoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expires_at = timezone.now() + timedelta(hours=24)
        story = Story.objects.create(
            user=request.user,
            expires_at=expires_at,
            **serializer.validated_data
        )
        return Response(StorySerializer(story, context={'request': request}).data, status=status.HTTP_201_CREATED)


class MyStoriesView(generics.ListAPIView):
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        return Story.objects.filter(user=self.request.user, expires_at__gt=now).order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
