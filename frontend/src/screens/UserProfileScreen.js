import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const UserProfileScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get(`/users/profile/${username}/`);
      setProfile(res.data);
      const postsRes = await apiClient.get('/posts/', { params: { author: username } });
      setPosts(postsRes.data.results || postsRes.data);

      if (me && me.username !== username) {
        const followersRes = await apiClient.get(`/users/${res.data.id}/followers/`);
        const amIFollowing = followersRes.data.results?.some(
          (f) => f.follower.username === me.username
        ) || followersRes.data.some((f) => f.follower.username === me.username);
        setIsFollowing(amIFollowing);
      }
    } catch (error) {
      console.log('Profile error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, me]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await apiClient.post(`/users/${profile.id}/follow/`);
      setIsFollowing((prev) => !prev);
      // Optimistically update counts
      setProfile((prev) => ({
        ...prev,
        followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
      }));
    } catch (e) {
      console.log('Follow error:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const isMe = me?.username === username;

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderPostGridItem = ({ item }) => (
    <View style={styles.gridItem}>
      {item.images?.length > 0 ? (
        <Image source={{ uri: item.images[0].image }} style={styles.gridImage} />
      ) : item.video_url ? (
        <View style={[styles.gridImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="play-circle" size={24} color="#fff" />
        </View>
      ) : null}
    </View>
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.bigAvatar} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <Text style={styles.username}>{profile.username}</Text>
      <Text style={styles.bio}>{profile.profile?.bio || ''}</Text>

      {!isMe && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn, { flex: 1 }]}
            onPress={toggleFollow}
            disabled={followLoading}
          >
            <Text style={[styles.followText, isFollowing && styles.followingText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigation.navigate('Chat', { userId: profile.id, username: profile.username })}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      ListHeaderComponent={ListHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} />
      }
      renderItem={renderPostGridItem}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginRight: 20,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: '#666',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  bio: {
    color: '#333',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#efefef',
  },
  followText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingText: {
    color: '#000',
  },
  messageBtn: {
    backgroundColor: '#efefef',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
});

export default UserProfileScreen;
