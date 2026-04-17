import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import SafeVideo from '../components/SafeVideo';

const { height, width } = Dimensions.get('window');

const ReelItem = React.memo(({ item, isVisible }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isLiked, setIsLiked] = useState(item.is_liked);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isVisible]);

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : prev - 1));
    try {
      const res = await apiClient.post(`/posts/${item.id}/like/`);
      setLikesCount(res.data.likes_count);
      setIsLiked(res.data.is_liked);
    } catch (e) {
      setIsLiked(!next);
      setLikesCount((prev) => (!next ? prev + 1 : prev - 1));
    }
  };

  return (
    <View style={styles.container}>
      {item.video_url ? (
        <SafeVideo
          ref={videoRef}
          style={styles.video}
          source={{ uri: item.video_url }}
          resizeMode="cover"
          isLooping
          onPlaybackStatusUpdate={(s) => setStatus(() => s)}
        />
      ) : null}

      <View style={styles.overlay}>
        <View style={styles.bottomSection}>
          <Text style={styles.username}>{item.author?.username}</Text>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>

        <View style={styles.sideActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={32} color={isLiked ? '#ed4956' : '#fff'} />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={32} color="#fff" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="paper-plane-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const ReelsScreen = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchReels = useCallback(async () => {
    try {
      const res = await apiClient.get('/posts/reels/');
      setReels(res.data.results || res.data);
    } catch (e) {
      console.log('Reels error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={reels}
      keyExtractor={(item) => item.id.toString()}
      pagingEnabled
      vertical
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      renderItem={({ item, index }) => (
        <ReelItem item={item} isVisible={index === currentIndex} />
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No reels yet.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: '#000',
  },
  video: {
    width,
    height,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 40,
  },
  bottomSection: {
    flex: 1,
    marginRight: 20,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
  },
  sideActions: {
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default ReelsScreen;
