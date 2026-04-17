import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewerScreen = ({ route, navigation }) => {
  const { stories, initialIndex = 0 } = route.params;
  const insets = useSafeAreaInsets();

  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentUser = stories[currentUserIndex];
  const currentStory = currentUser?.stories?.[currentStoryIndex];

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !paused) {
        goToNextStory();
      }
    });
  }, [currentStoryIndex, currentUserIndex, paused]);

  useEffect(() => {
    startProgress();
    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentStoryIndex, currentUserIndex, startProgress]);

  const goToNextStory = () => {
    const userStories = currentUser.stories;
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevUser = stories[currentUserIndex - 1];
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  const handleTap = (evt) => {
    const x = evt.nativeEvent.locationX;
    if (x < width * 0.3) {
      goToPrevStory();
    } else if (x > width * 0.7) {
      goToNextStory();
    }
  };

  const handleLongPress = (pressing) => {
    setPaused(pressing);
    if (pressing) {
      progressAnim.stopAnimation();
    } else {
      const remaining = (1 - progressAnim.__getValue()) * STORY_DURATION;
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remaining,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) goToNextStory();
      });
    }
  };

  if (!currentUser || !currentStory) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {currentUser.stories.map((_, idx) => (
          <View key={idx} style={styles.progressTrack}>
            {idx === currentStoryIndex ? (
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                ]}
              />
            ) : idx < currentStoryIndex ? (
              <View style={[styles.progressFill, { width: '100%' }]} />
            ) : null}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar} />
          <Text style={styles.username}>{currentUser.user.username}</Text>
          <Text style={styles.time}>
            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Story Media */}
      <TouchableWithoutFeedback
        onPressIn={() => handleLongPress(true)}
        onPressOut={() => handleLongPress(false)}
        onPress={handleTap}
      >
        <Image source={{ uri: currentStory.media_url }} style={styles.media} resizeMode="contain" />
      </TouchableWithoutFeedback>

      {currentStory.caption ? (
        <View style={styles.captionBox}>
          <Text style={styles.caption}>{currentStory.caption}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    marginRight: 8,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 8,
  },
  media: {
    flex: 1,
    width,
  },
  captionBox: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
  },
});

export default StoryViewerScreen;
