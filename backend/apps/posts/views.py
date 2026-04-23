from rest_framework import generics, permissions, status, parsers, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.notifications.services import send_push_notification
from .models import Post, Like, Comment, SavedPost, Hashtag
from .serializers import PostSerializer, PostCreateSerializer, CommentSerializer


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list('following_id', flat=True)
        return Post.objects.filter(author_id__in=following_ids, is_reel=False).select_related('author').prefetch_related('images', 'likes', 'comments')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ReelsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Post.objects.filter(is_reel=True).select_related('author').prefetch_related('images', 'likes', 'comments')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['caption', 'location']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Post.objects.all().select_related('author').prefetch_related('images', 'likes', 'comments', 'post_hashtags__hashtag')
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username=author)
        hashtag = self.request.query_params.get('hashtag')
        if hashtag:
            queryset = queryset.filter(post_hashtags__hashtag__name=hashtag.lower())
        reels_only = self.request.query_params.get('reels')
        if reels_only == '1':
            queryset = queryset.filter(is_reel=True)
        elif reels_only == '0':
            queryset = queryset.filter(is_reel=False)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = Post.objects.create(author=request.user, **serializer.validated_data)

        images = request.FILES.getlist('images')
        for index, image in enumerate(images):
            post.images.create(image=image, order=index)

        video = request.FILES.get('video')
        if video:
            post.video = video
            post.save()

        return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PostDetailView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.all().select_related('author').prefetch_related('images', 'likes', 'comments')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own posts.")
        instance.delete()


class LikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({"detail": "Unliked.", "likes_count": post.likes_count, "is_liked": False}, status=status.HTTP_200_OK)
        if post.author != request.user:
            send_push_notification(
                post.author,
                title=f"{request.user.username} liked your post",
                body=post.caption[:60] or "Check it out!",
                data={"type": "like", "post_id": str(post.id)},
                notification_type='like',
                sender=request.user,
                post=post,
            )
        return Response({"detail": "Liked.", "likes_count": post.likes_count, "is_liked": True}, status=status.HTTP_201_CREATED)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        return post.comments.select_related('user')

    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        comment = serializer.save(user=self.request.user, post=post)
        if post.author != self.request.user:
            send_push_notification(
                post.author,
                title=f"{self.request.user.username} commented on your post",
                body=comment.text[:60],
                data={"type": "comment", "post_id": str(post.id)},
                notification_type='comment',
                sender=self.request.user,
                post=post,
            )


class BookmarkToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        save_obj, created = SavedPost.objects.get_or_create(user=request.user, post=post)
        if not created:
            save_obj.delete()
            return Response({"detail": "Unsaved.", "is_saved": False}, status=status.HTTP_200_OK)
        return Response({"detail": "Saved.", "is_saved": True}, status=status.HTTP_201_CREATED)


class SavedPostsListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(saves__user=self.request.user).select_related('author').prefetch_related('images', 'likes', 'comments')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class TrendingHashtagsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        hashtags = Hashtag.objects.all()[:20]
        data = [{'name': h.name, 'usage_count': h.usage_count} for h in hashtags]
        return Response(data)
