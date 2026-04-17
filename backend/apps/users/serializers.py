from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile, Follow, DeviceToken


class ProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['bio', 'profile_image', 'website', 'is_private']

    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image and request:
            return request.build_absolute_uri(obj.profile_image.url)
        return None


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'profile', 'followers_count', 'following_count', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user)
        return user


class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(required=False, write_only=True)
    website = serializers.CharField(required=False, write_only=True)
    profile_image = serializers.ImageField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['bio', 'website', 'profile_image']

    def update(self, instance, validated_data):
        bio = validated_data.pop('bio', None)
        website = validated_data.pop('website', None)
        profile_image = validated_data.pop('profile_image', None)
        instance = super().update(instance, validated_data)
        profile = instance.profile
        if bio is not None:
            profile.bio = bio
        if website is not None:
            profile.website = website
        if profile_image:
            profile.profile_image = profile_image
        profile.save()
        return instance


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['token', 'platform']
