from django.contrib import admin
from .models import Post, PostImage, Like, Comment, SavedPost, Hashtag, PostHashtag


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('author', 'caption', 'is_reel', 'created_at')
    search_fields = ('author__username', 'caption')
    list_filter = ('created_at', 'is_reel')
    inlines = [PostImageInline]


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'text', 'created_at')
    search_fields = ('text', 'user__username')


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    search_fields = ('user__username',)


@admin.register(Hashtag)
class HashtagAdmin(admin.ModelAdmin):
    list_display = ('name', 'usage_count', 'created_at')
    search_fields = ('name',)
