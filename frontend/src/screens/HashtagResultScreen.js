import React, { useState, useEffect } from 'react';
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

const HashtagResultScreen = ({ route, navigation }) => {
  const { tag } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/posts/?hashtag=${encodeURIComponent(tag)}`)
      .then((res) => setPosts(res.data.results || res.data))
      .catch((e) => console.log('Hashtag posts error:', e))
      .finally(() => setLoading(false));
  }, [tag]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      {item.images?.length > 0 ? (
        <Image source={{ uri: item.images[0].image }} style={styles.gridImage} />
      ) : (
        <View style={styles.gridImagePlaceholder}>
          <Text style={styles.gridImageLabel}>#{tag}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{tag}</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
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
  },
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
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
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
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImageLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
});

export default HashtagResultScreen;
