import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications/');
      setNotifications(res.data.results || res.data);
    } catch (e) {
      console.log('Notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const unsubscribe = navigation.addListener('focus', fetchNotifications);
    return unsubscribe;
  }, [fetchNotifications, navigation]);

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.log('Mark read error:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.log('Mark all read error:', e);
    }
  };

  const handlePress = (item) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    if (item.notification_type === 'follow') {
      navigation.navigate('UserProfile', { username: item.sender.username });
    } else if (item.post_id) {
      navigation.navigate('PostDetail', { postId: item.post_id });
    }
  };

  const renderItem = ({ item }) => {
    const iconMap = {
      like: 'heart',
      comment: 'chatbubble',
      follow: 'person-add',
      mention: 'at',
    };
    const iconName = iconMap[item.notification_type] || 'notifications';
    const avatarUrl = item.sender?.profile?.profile_image;

    return (
      <TouchableOpacity
        style={[styles.item, !item.is_read && styles.unreadItem]}
        onPress={() => handlePress(item)}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.text}>
            <Text style={styles.username}>{item.sender?.username} </Text>
            {item.text}
          </Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Ionicons name={iconName} size={20} color={!item.is_read ? '#0095f6' : '#999'} style={styles.icon} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
      />
    </View>
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
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  markAll: {
    color: '#0095f6',
    fontWeight: '600',
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: 'bold',
  },
  time: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  icon: {
    marginLeft: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default NotificationsScreen;
