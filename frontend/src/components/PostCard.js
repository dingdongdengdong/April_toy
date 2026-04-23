import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import apiClient from '../api/client';
import SafeVideo from './SafeVideo';

const { width } = Dimensions.get('window');

const PostCard = React.memo(({ post, navigation, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);

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

  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentImageIndex(index);
  };

  const avatarUrl = post.author?.profile?.profile_image;
  const hasMultipleImages = post.images && post.images.length > 1;

  const renderMedia = () => {
    if (post.video_url) {
      return (
        <View style={styles.mediaContainer}>
          <SafeVideo
            ref={videoRef}
            style={styles.postImage}
            source={{ uri: post.video_url }}
            resizeMode="cover"
            isLooping
            shouldPlay={!isPaused}
            isMuted={isMuted}
            useNativeControls={false}
          />
          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted((m) => !m)}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={() => setIsPaused((p) => !p)}
          >
            {isPaused && <Ionicons name="play-circle" size={48} color="#fff" />}
          </TouchableOpacity>
        </View>
      );
    }

    if (post.images?.length > 0) {
      if (post.images.length === 1) {
        return (
          <Image source={{ uri: post.images[0].image }} style={styles.postImage} resizeMode="cover" />
        );
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
              <Image key={img.id} source={{ uri: img.image }} style={styles.postImage} resizeMode="cover" />
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

    return <View style={styles.postImage} />;
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={goToProfile}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color="#999" />
          </View>
        )}
        <Text style={styles.username}>{post.author?.username}</Text>
      </TouchableOpacity>

      <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
        <View>
          {renderMedia()}
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

      {hasMultipleImages && (
        <Text style={styles.pageIndicator}>
          {currentImageIndex + 1} / {post.images.length}
        </Text>
      )}

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
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  mediaContainer: {
    position: 'relative',
  },
  postImage: {
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
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 6,
  },
  playPauseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  pageIndicator: {
    paddingHorizontal: 10,
    marginTop: 4,
    fontSize: 12,
    color: '#666',
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
