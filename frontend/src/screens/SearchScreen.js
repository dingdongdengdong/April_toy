import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/users/search/?search=${encodeURIComponent(q)}`);
      setUsers(res.data.results || res.data);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      searchUsers(query);
    }, 400);
    return () => clearTimeout(delay);
  }, [query, searchUsers]);

  useEffect(() => {
    apiClient.get('/posts/trending-hashtags/')
      .then((res) => setTrending(res.data))
      .catch((e) => console.log('Trending error:', e));
  }, []);

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('UserProfile', { username: item.username })}
    >
      <View style={styles.avatar} />
      <View>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.name}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrending = () => (
    <View style={styles.trendingSection}>
      <Text style={styles.sectionTitle}>Trending Hashtags</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {trending.map((tag) => (
          <TouchableOpacity
            key={tag.name}
            style={styles.hashtagPill}
            onPress={() => navigation.navigate('HashtagResult', { tag: tag.name })}
          >
            <Text style={styles.hashtagText}>#{tag.name}</Text>
            <Text style={styles.hashtagCount}>{tag.usage_count} posts</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Search users or #hashtags"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {query.length === 0 && renderTrending()}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={styles.empty}>No users found.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efefef',
    margin: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  trendingSection: {
    paddingVertical: 10,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  hashtagPill: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#0095f6',
  },
  hashtagText: {
    color: '#0095f6',
    fontWeight: 'bold',
  },
  hashtagCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  name: {
    color: '#666',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
});

export default SearchScreen;
