# Frontend Handbook — Instagram Clone

> **Audience:** Junior Frontend Engineers (React Native / Expo)  
> **Goal:** Understand the codebase, follow patterns, and ship UI features consistently.

---

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native (Expo SDK 55) |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| HTTP Client | Axios |
| Local Storage | `@react-native-async-storage/async-storage` |
| Images | `expo-image-picker`, `expo-image-manipulator`, `expo-file-system` |
| Gestures | `react-native-gesture-handler` |
| Safe Areas | `react-native-safe-area-context` |
| Icons | `@expo/vector-icons` (`Ionicons`) |

---

## 2. Folder Structure

```
frontend/src/
├── api/
│   └── client.js              # Axios instance + JWT interceptors
├── components/
│   └── PostCard.js            # Reusable post card (feed)
├── context/
│   └── AuthContext.js         # Global auth state
├── hooks/
│   └── (empty for now)        # Custom hooks go here
├── navigation/
│   └── AppNavigator.js        # All navigators
├── screens/
│   ├── FeedScreen.js
│   ├── CommentsScreen.js
│   ├── PostDetailScreen.js
│   ├── SearchScreen.js
│   ├── HashtagResultScreen.js
│   ├── UserProfileScreen.js
│   ├── ProfileScreen.js
│   ├── EditProfileScreen.js
│   ├── SavedPostsScreen.js
│   ├── CreatePostScreen.js
│   ├── ReelsScreen.js
│   ├── CreateStoryScreen.js
│   ├── StoryViewerScreen.js
│   ├── MessagesListScreen.js
│   ├── ChatScreen.js
│   ├── FollowersListScreen.js
│   ├── FollowingListScreen.js
│   ├── LoginScreen.js
│   └── RegisterScreen.js
└── utils/
    └── (helpers, constants)
```

**Rule:** One screen = one file in `screens/`. One reusable UI chunk = one file in `components/`.

---

## 3. Navigation Architecture

We use nested navigators:

```
NavigationContainer
└── AuthProvider
    └── AuthStack (logged out)
    └── MainTabNavigator (logged in)
         ├── HomeStack
         ├── SearchStack
         ├── CreatePostScreen
         └── ProfileStack
```

### Adding a New Screen
1. Create the screen component in `src/screens/`
2. Import it in `AppNavigator.js`
3. Add it to the correct Stack inside the tab
4. Navigate with `navigation.navigate('ScreenName', { params })`

**Important:** Screens referenced inside a Stack must be registered in that Stack. Cross-stack navigation works if the screen name is unique.

---

## 4. API Client (Axios)

`src/api/client.js` handles:
- Base URL pointing to the backend
- Attaching JWT access token to every request
- **Silent token refresh** on `401` errors

### Making requests
```javascript
import apiClient from '../api/client';

// GET
const res = await apiClient.get('/posts/feed/');

// POST JSON
await apiClient.post('/posts/1/like/');

// POST FormData (uploads)
await apiClient.post('/posts/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

### Changing the backend IP
Edit `src/api/client.js`:
```javascript
const API_URL = 'http://YOUR_MAC_IP:8000/api';
```

---

## 5. Auth Flow

`AuthContext.js` exposes:
- `user` — current logged-in user object
- `loading` — auth check in progress
- `login(email, password)`
- `register(email, username, password, passwordConfirm)`
- `logout()`

### Usage in a screen
```javascript
import { useAuth } from '../context/AuthContext';

const MyScreen = () => {
  const { user, logout } = useAuth();
  // ...
};
```

**Rule:** Always use `useAuth()` instead of manually reading AsyncStorage.

---

## 6. Image Uploads (Critical for Android)

Real Android devices often can't upload directly from gallery URIs. We copy to cache first:

```javascript
import * as FileSystem from 'expo-file-system';

const cacheUri = FileSystem.cacheDirectory + 'upload.jpg';
await FileSystem.copyAsync({ from: originalUri, to: cacheUri });

formData.append('images', {
  uri: cacheUri,
  name: 'photo.jpg',
  type: 'image/jpeg',
});
```

See `CreatePostScreen.js` and `CreateStoryScreen.js` for full examples.

---

## 7. Styling Conventions

- Use `StyleSheet.create()` for every screen/component
- Avoid inline styles for repeated elements
- Use `Dimensions.get('window')` for full-width images
- Use `useSafeAreaInsets()` for notched devices

### Example pattern
```javascript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

---

## 8. Performance Rules

1. **Memoize list items**
   - `PostCard` is wrapped in `React.memo` to prevent re-renders on scroll.

2. **Use `keyExtractor`**
   ```javascript
   <FlatList keyExtractor={(item) => item.id.toString()} />
   ```

3. **Compress before upload**
   ```javascript
   await ImageManipulator.manipulateAsync(
     uri,
     [{ resize: { width: 1080 } }],
     { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
   );
   ```

4. **Lazy load screens**
   - Stack screens are inherently lazy. Keep it that way.

---

## 9. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Network Error` | Wrong backend IP | Update `api/client.js` with Mac IP |
| Images don't show | Using relative URL | Backend returns absolute URLs |
| Upload fails on Android | URI scheme issue | Copy to `FileSystem.cacheDirectory` first |
| `CORS error` | Missing origin in backend | Add phone IP to `CORS_EXTRA_ORIGINS` |
| Navigation not found | Screen not in current stack | Register screen in correct Stack Navigator |
| Double-tap gesture doesn't work | Missing `GestureHandlerRootView` | Already wrapped in `App.js` |

---

## 10. Adding a New Feature (Step-by-Step)

Example: "Add a Settings screen"

1. `src/screens/SettingsScreen.js` — build the UI
2. `src/navigation/AppNavigator.js`:
   ```javascript
   import SettingsScreen from '../screens/SettingsScreen';
   // Add inside ProfileStack:
   <Stack.Screen name="Settings" component={SettingsScreen} />
   ```
3. Trigger navigation from Profile:
   ```javascript
   navigation.navigate('Settings');
   ```
4. Test on device. If it needs backend data, add API call in `useEffect`.
