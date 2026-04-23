import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const MessagesListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiClient.get('/messages/conversations/');
      const messages = res.data.results || res.data;
      // Group by conversation partner and take latest message
      const map = new Map();
      messages.forEach((msg) => {
        const partner = msg.sender.id === user.id ? msg.recipient : msg.sender;
        if (!map.has(partner.id) || new Date(msg.created_at) > new Date(map.get(partner.id).created_at)) {
          map.set(partner.id, { ...msg, partner });
        }
      });
      setConversations(Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      console.log('Conversations error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const unsubscribe = navigation.addListener('focus', fetchConversations);
    return unsubscribe;
  }, [navigation, fetchConversations]);

  const renderItem = ({ item }) => {
    const partner = item.partner;
    const isMe = item.sender.id === user.id;
    const avatarUrl = partner?.profile?.profile_image;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Chat', { userId: partner.id, username: partner.username })}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View style={styles.body}>
          <Text style={styles.username}>{partner.username}</Text>
          <Text style={[styles.preview, !item.is_read && !isMe && styles.unread]} numberOfLines={1}>
            {isMe ? 'You: ' : ''}{item.text}
          </Text>
        </View>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.partner.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ddd', marginRight: 12 },
  body: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  preview: { color: '#666', fontSize: 14 },
  unread: { fontWeight: 'bold', color: '#000' },
  time: { color: '#999', fontSize: 12 },
  empty: { textAlign: 'center', color: '#666', marginTop: 30 },
});

export default MessagesListScreen;
