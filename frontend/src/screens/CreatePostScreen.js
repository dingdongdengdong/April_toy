import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import SafeVideo from '../components/SafeVideo';
import apiClient from '../api/client';

const CreatePostScreen = ({ navigation }) => {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [isReel, setIsReel] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const compressed = await Promise.all(
        result.assets.map(async (asset) => {
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          return manipulated;
        })
      );
      setImages((prev) => [...prev, ...compressed]);
      setVideo(null);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Videos,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setVideo(result.assets[0]);
      setImages([]);
      setIsReel(true);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0 && !video) {
      Alert.alert('No media', 'Please select at least one image or video.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('is_reel', isReel ? 'true' : 'false');

      if (video) {
        const cacheUri = FileSystem.cacheDirectory + 'upload_video.mp4';
        await FileSystem.copyAsync({ from: video.uri, to: cacheUri });
        formData.append('video', {
          uri: cacheUri,
          name: 'video.mp4',
          type: 'video/mp4',
        });
      } else {
        images.forEach((img, index) => {
          formData.append('images', {
            uri: img.uri,
            name: `photo_${index}.jpg`,
            type: 'image/jpeg',
          });
        });
      }

      await apiClient.post('/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', isReel ? 'Reel uploaded!' : 'Post created!');
      setCaption('');
      setImages([]);
      setVideo(null);
      setIsReel(false);
      navigation.navigate('Home');
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{isReel ? 'New Reel' : 'New Post'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <View style={styles.mediaButtons}>
        <Button title="Pick Images" onPress={pickImage} />
        <View style={{ width: 10 }} />
        <Button title="Pick Video" onPress={pickVideo} />
      </View>

      {video ? (
        <View style={styles.previewWrapper}>
          <SafeVideo
            source={{ uri: video.uri }}
            style={styles.previewVideo}
            resizeMode="cover"
            useNativeControls
          />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setVideo(null); setIsReel(false); }}>
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.previewWrapper}>
              <Image source={{ uri: img.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {images.length > 0 && (
        <View style={styles.reelToggle}>
          <Text>Post as Reel</Text>
          <Switch value={isReel} onValueChange={setIsReel} />
        </View>
      )}

      {uploading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <Button title={isReel ? 'Share Reel' : 'Share'} onPress={handleSubmit} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 5,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  previewWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  previewVideo: {
    width: 200,
    height: 350,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
});

export default CreatePostScreen;
