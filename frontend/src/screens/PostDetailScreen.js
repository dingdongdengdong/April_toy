import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    try {
      const res = await apiClient.get(`/posts/${postId}/`);
      setPost(res.data);
    } catch (e) {
      console.log('Post detail error:', e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading || !post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.userRow}>
        <View style={styles.avatar} />
        <Text style={styles.username}>{post.author?.username}</Text>
      </View>

      {post.images?.map((img) => (
        <Image key={img.id} source={{ uri: img.image }} style={styles.image} resizeMode="cover" />
      ))}

      <View style={styles.body}>
        <Text style={styles.likes}>{post.likes_count} likes</Text>
        <Text style={styles.caption}>
          <Text style={styles.username}>{post.author?.username} </Text>
          {post.caption}
        </Text>
        <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  image: {
    width,
    height: width,
    backgroundColor: '#eee',
  },
  body: {
    padding: 12,
  },
  likes: {
    fontWeight: '600',
    marginBottom: 6,
  },
  caption: {
    fontSize: 14,
    marginBottom: 6,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
});

export default PostDetailScreen;
