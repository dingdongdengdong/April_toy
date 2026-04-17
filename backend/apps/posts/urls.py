from django.urls import path
from .views import (
    FeedView, ReelsView, PostListCreateView, PostDetailView,
    LikeToggleView, CommentListCreateView,
    BookmarkToggleView, SavedPostsListView, TrendingHashtagsView
)

urlpatterns = [
    path('feed/', FeedView.as_view(), name='feed'),
    path('reels/', ReelsView.as_view(), name='reels'),
    path('saved/', SavedPostsListView.as_view(), name='saved-posts'),
    path('trending-hashtags/', TrendingHashtagsView.as_view(), name='trending-hashtags'),
    path('', PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:post_id>/like/', LikeToggleView.as_view(), name='like-toggle'),
    path('<int:post_id>/bookmark/', BookmarkToggleView.as_view(), name='bookmark-toggle'),
    path('<int:post_id>/comments/', CommentListCreateView.as_view(), name='comment-list-create'),
]
