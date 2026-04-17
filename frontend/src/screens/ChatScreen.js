import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://10.34.83.169:8000';

const ChatScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const flatListRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiClient.get(`/messages/history/${userId}/`);
      setMessages(res.data.results || res.data);
    } catch (e) {
      console.log('History error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const socket = new WebSocket(`ws://${API_URL.replace('http://', '')}/ws/chat/?token=${token}`);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.sender_id === user.id || data.recipient_id === user.id) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.id);
            if (exists) return prev;
            return [...prev, {
              id: data.id || Date.now(),
              sender: { id: data.sender_id },
              recipient: { id: data.recipient_id },
              text: data.text,
              created_at: data.created_at,
              is_read: false,
            }];
          });
        }
      };

      socket.onerror = (e) => {
        console.log('WebSocket error:', e);
      };

      socket.onclose = () => {
        setConnected(false);
      };

      ws.current = socket;
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user.id]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({
      action: 'send_message',
      recipient_id: userId,
      text: text.trim(),
    }));
    setText('');
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender.id === user.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username}</Text>
        <View style={{ width: 28 }} />
      </View>

      {!connected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} disabled={!text.trim()}>
          <Ionicons name="send" size={24} color={text.trim() ? '#0095f6' : '#b3dffc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectionBanner: {
    backgroundColor: '#ffcc00',
    padding: 6,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0095f6',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#efefef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#dbdbdb',
  },
  input: {
    flex: 1,
    maxHeight: 80,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#fafafa',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 10,
  },
});

export default ChatScreen;
