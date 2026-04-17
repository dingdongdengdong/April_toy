import React, { useEffect, useState, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.get(`/users/profile/${user.username}/`);
      setProfile(res.data);
      const postsRes = await apiClient.get('/posts/', { params: { author: user.username } });
      setPosts(postsRes.data.results || postsRes.data);
    } catch (error) {
      console.log('Profile error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderPostGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      {item.images?.length > 0 ? (
        <Image source={{ uri: item.images[0].image }} style={styles.gridImage} />
      ) : item.video_url ? (
        <View style={[styles.gridImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="play-circle" size={24} color="#fff" />
        </View>
      ) : null}
    </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.stat}
            onPress={() => navigation.navigate('FollowersList', { userId: profile.id, username: profile.username })}
          >
            <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => navigation.navigate('FollowingList', { userId: profile.id, username: profile.username })}
          >
            <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.username}>{profile.username}</Text>
      <Text style={styles.bio}>{profile.profile?.bio || ''}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.savedBtn} onPress={() => navigation.navigate('SavedPosts')}>
          <Text style={styles.savedText}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageBtn} onPress={() => navigation.navigate('MessagesList')}>
          <Text style={styles.messageText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#efefef',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editText: {
    fontWeight: '600',
  },
  savedBtn: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  savedText: {
    fontWeight: '600',
  },
  messageBtn: {
    flex: 1,
    backgroundColor: '#e6f3ff',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0095f6',
  },
  messageText: {
    fontWeight: '600',
    color: '#0095f6',
  },
  logoutBtn: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  logoutText: {
    fontWeight: '600',
    color: '#ed4956',
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

export default ProfileScreen;
