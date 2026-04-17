import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';

const SavedPostsScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await apiClient.get('/posts/saved/');
      setPosts(res.data.results || res.data);
    } catch (error) {
      console.log('Saved posts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handlePostUpdate = (updatedPost) => {
    if (!updatedPost.is_saved) {
      setPosts((prev) => prev.filter((p) => p.id !== updatedPost.id));
    } else {
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    }
  };

  const renderItem = ({ item }) => (
    <PostCard post={item} navigation={navigation} onUpdate={handlePostUpdate} />
  );

  if (loading) {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSaved(); }} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No saved posts yet.</Text>
          <Text style={styles.emptySubText}>Tap the bookmark icon on a post to save it.</Text>
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
});

export default SavedPostsScreen;
