import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const PostCard = React.memo(({ post, navigation, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [scaleAnim] = useState(new Animated.Value(0));

  const handleLikeToggle = useCallback(async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));
    try {
      const res = await apiClient.post(`/posts/${post.id}/like/`);
      setLikesCount(res.data.likes_count);
      setIsLiked(res.data.is_liked);
      if (onUpdate) onUpdate({ ...post, is_liked: res.data.is_liked, likes_count: res.data.likes_count });
    } catch (e) {
      // rollback on error
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : prev - 1));
    }
  }, [isLiked, post.id, onUpdate]);

  const onDoubleTap = useCallback((event) => {
    if (event.nativeEvent.state === State.END) {
      if (!isLiked) {
        handleLikeToggle();
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0, duration: 200, delay: 300, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [isLiked, handleLikeToggle, scaleAnim]);

  const openComments = () => {
    navigation.navigate('Comments', { postId: post.id });
  };

  const goToProfile = () => {
    navigation.navigate('UserProfile', { username: post.author.username });
  };

  const handleBookmarkToggle = useCallback(async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      const res = await apiClient.post(`/posts/${post.id}/bookmark/`);
      setIsSaved(res.data.is_saved);
      if (onUpdate) onUpdate({ ...post, is_saved: res.data.is_saved });
    } catch (e) {
      setIsSaved(!nextSaved);
    }
  }, [isSaved, post.id, onUpdate]);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={goToProfile}>
        <View style={styles.avatar} />
        <Text style={styles.username}>{post.author?.username}</Text>
      </TouchableOpacity>

      <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
        <View>
          {post.video_url ? (
            <View style={styles.postImage}>
              {post.images?.[0]?.image ? (
                <Image source={{ uri: post.images[0].image }} style={styles.postImage} resizeMode="cover" />
              ) : (
                <View style={[styles.postImage, { backgroundColor: '#000' }]} />
              )}
              <View style={styles.videoIndicator}>
                <Ionicons name="play-circle" size={48} color="#fff" />
              </View>
            </View>
          ) : post.images?.length > 0 && (
            <Image source={{ uri: post.images[0].image }} style={styles.postImage} resizeMode="cover" />
          )}
          <Animated.View
            style={[
              styles.heartOverlay,
              { transform: [{ scale: scaleAnim }], opacity: scaleAnim },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={80} color="#fff" />
          </Animated.View>
        </View>
      </TapGestureHandler>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLikeToggle} style={styles.actionBtn}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#ed4956' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openComments} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={26} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={26} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleBookmarkToggle} style={styles.actionBtn}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.likes}>{likesCount} likes</Text>

      <View style={styles.captionRow}>
        <Text style={styles.caption}>
          <Text style={styles.username}>{post.author?.username} </Text>
          {post.caption}
        </Text>
      </View>

      {post.comments_count > 0 && (
        <TouchableOpacity onPress={openComments}>
          <Text style={styles.viewComments}>View all {post.comments_count} comments</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
  postImage: {
    width,
    height: width,
    backgroundColor: '#eee',
  },
  videoIndicator: {
    position: 'absolute',
    top: width / 2 - 24,
    left: width / 2 - 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
  },
  heartOverlay: {
    position: 'absolute',
    top: width / 2 - 40,
    left: width / 2 - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  actionBtn: {
    marginRight: 14,
  },
  likes: {
    fontWeight: '600',
    paddingHorizontal: 10,
    marginTop: 6,
  },
  captionRow: {
    paddingHorizontal: 10,
    marginTop: 4,
  },
  caption: {
    fontSize: 14,
  },
  viewComments: {
    paddingHorizontal: 10,
    marginTop: 4,
    color: '#666',
  },
  timestamp: {
    paddingHorizontal: 10,
    marginTop: 4,
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default PostCard;
