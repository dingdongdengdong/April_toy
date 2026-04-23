from rest_framework import serializers
from .models import Notification
from apps.users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    post_id = serializers.IntegerField(source='post.id', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'sender', 'notification_type', 'post_id', 'text', 'is_read', 'created_at']
        read_only_fields = ['id', 'recipient', 'sender', 'notification_type', 'post_id', 'text', 'created_at']
