import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';

const StoriesBar = ({ stories, navigation, currentUser }) => {
  // Group stories by user
  const grouped = {};
  stories.forEach((story) => {
    const uid = story.user.id;
    if (!grouped[uid]) {
      grouped[uid] = { user: story.user, stories: [] };
    }
    grouped[uid].stories.push(story);
  });
  const groupedArray = Object.values(grouped).reverse();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
      {/* My Story */}
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => navigation.navigate('CreateStory')}
      >
        <View style={[styles.storyRing, { borderColor: '#dbdbdb' }]}>
          <View style={styles.storyAvatar} />
        </View>
        <Text style={styles.storyName}>Your story</Text>
      </TouchableOpacity>

      {groupedArray.map((group, index) => (
        <TouchableOpacity
          key={group.user.id}
          style={styles.storyItem}
          onPress={() => navigation.navigate('StoryViewer', { stories: groupedArray, initialIndex: index })}
        >
          <View style={styles.storyRing}>
            <View style={styles.storyAvatar} />
          </View>
          <Text style={styles.storyName} numberOfLines={1}>
            {group.user.username}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      const [postsRes, storiesRes] = await Promise.all([
        apiClient.get(`/posts/feed/?page=${pageNum}`),
        apiClient.get('/stories/'),
      ]);
      const results = postsRes.data.results || [];
      setStories(storiesRes.data.results || storiesRes.data || []);

      if (isRefresh || pageNum === 1) {
        setPosts(results);
      } else {
        setPosts((prev) => [...prev, ...results]);
      }
      setHasMore(!!postsRes.data.next);
      setPage(pageNum);
    } catch (error) {
      console.log('Feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loading && !refreshing) {
      fetchFeed(page + 1, false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const renderItem = ({ item }) => (
    <PostCard post={item} navigation={navigation} onUpdate={handlePostUpdate} />
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={<StoriesBar stories={stories} navigation={navigation} currentUser={user} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={hasMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No posts yet.</Text>
          <Text style={styles.emptySubText}>Follow someone or create your first post!</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#666',
  },
  storiesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#ed4956',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ddd',
  },
  storyName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default FeedScreen;
