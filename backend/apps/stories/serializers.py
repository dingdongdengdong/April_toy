from rest_framework import serializers
from .models import Story


class StorySerializer(serializers.ModelSerializer):
    media_url = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ['id', 'user', 'media_url', 'caption', 'created_at', 'expires_at']
        read_only_fields = ['id', 'created_at', 'expires_at']

    def get_media_url(self, obj):
        request = self.context.get('request')
        if request and obj.media:
            return request.build_absolute_uri(obj.media.url)
        return obj.media.url if obj.media else None

    def get_user(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.user, context=self.context).data


class StoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['media', 'caption']
