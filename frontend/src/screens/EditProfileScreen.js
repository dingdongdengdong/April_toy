import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.profile?.bio || '');
      setWebsite(user.profile?.website || '');
      setProfileImage(user.profile?.profile_image || null);
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let data;
      let headers = {};
      if (profileImage && profileImage.startsWith('file://')) {
        const formData = new FormData();
        formData.append('bio', bio);
        formData.append('website', website);
        formData.append('profile_image', {
          uri: profileImage,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        data = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        data = { bio, website };
      }

      await apiClient.patch('/users/me/', data, { headers });
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <Text style={styles.changePhoto}>Change Profile Photo</Text>
      </TouchableOpacity>

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={150}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      {saving ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <Button title="Save" onPress={handleSave} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
  },
  changePhoto: {
    color: '#0095f6',
    marginTop: 10,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
});

export default EditProfileScreen;
