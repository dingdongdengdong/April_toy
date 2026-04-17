import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

let Video;

try {
  const av = require('expo-av');
  Video = av.Video;
} catch (e) {
  Video = null;
}

const SafeVideo = forwardRef(({ source, style, resizeMode, isLooping, useNativeControls, ...props }, ref) => {
  if (!Video) {
    return (
      <View style={[style, styles.fallback]}>
        <Text style={styles.fallbackText}>Video preview not available in Expo Go</Text>
      </View>
    );
  }

  return (
    <Video
      ref={ref}
      source={source}
      style={style}
      resizeMode={resizeMode || 'cover'}
      isLooping={isLooping}
      useNativeControls={useNativeControls}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
});

export default SafeVideo;
