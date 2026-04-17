import React, { useState, useEffect, useCallback } from 'react';
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
import apiClient from '../api/client';

const CommentsScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await apiClient.get(`/posts/${postId}/comments/`);
      setComments(res.data.results || res.data);
    } catch (e) {
      console.log('Fetch comments error:', e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await apiClient.post(`/posts/${postId}/comments/`, { text: text.trim() });
      setComments((prev) => [res.data, ...prev]);
      setText('');
    } catch (e) {
      console.log('Post comment error:', e);
    } finally {
      setPosting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.commentRow}>
      <View style={styles.avatar} />
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.username}>{item.user?.username} </Text>
          {item.text}
        </Text>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No comments yet. Be the first to comment!</Text>
          }
        />
      )}

      <View style={styles.inputBar}>
        <View style={styles.avatarSmall} />
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={submitComment} disabled={posting || !text.trim()}>
          <Text style={[styles.postBtn, (!text.trim() || posting) && styles.postBtnDisabled]}>
            Post
          </Text>
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
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: 'bold',
  },
  time: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
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
  },
  postBtn: {
    color: '#0095f6',
    fontWeight: '600',
    marginLeft: 10,
  },
  postBtnDisabled: {
    color: '#b3dffc',
  },
});

export default CommentsScreen;
