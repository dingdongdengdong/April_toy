from django.urls import path
from .views import StoryListCreateView, MyStoriesView

urlpatterns = [
    path('', StoryListCreateView.as_view(), name='story-list-create'),
    path('me/', MyStoriesView.as_view(), name='my-stories'),
]
