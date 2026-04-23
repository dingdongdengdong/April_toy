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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SafeVideo from '../components/SafeVideo';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/posts/${postId}/`);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentImageIndex(index);
  };

  if (loading || !post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isAuthor = user?.username === post.author?.username;
  const avatarUrl = post.author?.profile?.profile_image;
  const hasMultipleImages = post.images && post.images.length > 1;

  const renderMedia = () => {
    if (post.video_url) {
      return (
        <SafeVideo
          style={styles.image}
          source={{ uri: post.video_url }}
          resizeMode="cover"
          isLooping
          shouldPlay
          isMuted
          useNativeControls
        />
      );
    }

    if (post.images?.length > 0) {
      if (post.images.length === 1) {
        return <Image source={{ uri: post.images[0].image }} style={styles.image} resizeMode="cover" />;
      }

      return (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {post.images.map((img) => (
              <Image key={img.id} source={{ uri: img.image }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>
          <View style={styles.dotsContainer}>
            {post.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    return <View style={styles.image} />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        {isAuthor ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#ed4956" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <View style={styles.userRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color="#999" />
          </View>
        )}
        <Text style={styles.username}>{post.author?.username}</Text>
      </View>

      {renderMedia()}

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
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
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
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#0095f6',
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
