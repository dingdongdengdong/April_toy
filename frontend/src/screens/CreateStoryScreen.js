import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import apiClient from '../api/client';

const CreateStoryScreen = ({ navigation }) => {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 720 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setMedia(compressed);
    }
  };

  const handleSubmit = async () => {
    if (!media) {
      Alert.alert('No media', 'Please select an image.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', {
        uri: media.uri,
        name: 'story.jpg',
        type: 'image/jpeg',
      });
      if (caption) {
        formData.append('caption', caption);
      }

      await apiClient.post('/stories/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Story shared!');
      navigation.goBack();
    } catch (error) {
      console.log('Story upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add to Story</Text>
      {media ? (
        <Image source={{ uri: media.uri }} style={styles.preview} />
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={pickImage}>
          <Text style={styles.placeholderText}>Tap to select photo</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {!media && <Button title="Choose from Gallery" onPress={pickImage} />}
        {media && <Button title="Retake" onPress={pickImage} color="#666" />}
      </View>

      {media && (
        <View style={{ marginTop: 20 }}>
          {uploading ? <ActivityIndicator /> : <Button title="Share to Story" onPress={handleSubmit} />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    backgroundColor: '#222',
    marginBottom: 20,
  },
  placeholder: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
  },
  actions: {
    marginTop: 10,
  },
});

export default CreateStoryScreen;
