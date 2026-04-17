from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from .models import Message
from .serializers import MessageSerializer

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get latest message per conversation partner
        latest_sent = Message.objects.filter(sender=user).values('recipient').annotate(
            latest=models.Max('created_at')
        )
        latest_received = Message.objects.filter(recipient=user).values('sender').annotate(
            latest=models.Max('created_at')
        )
        
        # Combine and get the actual messages
        qs = Message.objects.filter(
            models.Q(sender=user, recipient__in=[x['recipient'] for x in latest_sent]) |
            models.Q(recipient=user, sender__in=[x['sender'] for x in latest_received])
        ).select_related('sender', 'recipient')
        
        # Simpler approach: get all messages involving user, deduplicate in serializer or frontend
        return Message.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).select_related('sender', 'recipient').order_by('-created_at')


class MessageHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_id = self.kwargs['user_id']
        return Message.objects.filter(
            models.Q(sender=user, recipient_id=other_id) |
            models.Q(sender_id=other_id, recipient=user)
        ).select_related('sender', 'recipient').order_by('created_at')
