# Feature Test Report — Instagram Clone

> **Date:** 2026-04-17  
> **Device:** Samsung Galaxy S22 Ultra (Android 14)  
> **Backend:** Django + Daphne ASGI on `http://10.34.83.169:8000`  
> **Frontend:** React Native + Expo SDK 55

---

## Legend

- ✅ **PASS** — Feature works as expected
- 🟡 **PARTIAL** — Feature works with known limitations
- ❌ **FAIL** — Feature broken / needs fix

---

## 1. Saved Posts / Bookmarks ✅

### Backend Tests
| Test | Result | Notes |
|------|--------|-------|
| `POST /api/posts/2/bookmark/` | ✅ | Returns `{"detail": "Saved.", "is_saved": true}` |
| `GET /api/posts/saved/` | ✅ | Returns 1 saved post for testuser |
| Toggle again (unsave) | ✅ | Returns `{"detail": "Unsaved.", "is_saved": false}` |

### Frontend Status
- Bookmark icon renders on `PostCard`
- `SavedPostsScreen` accessible from Profile tab
- Unsaving a post removes it from the saved list immediately

---

## 2. Hashtags & Trending Search ✅

### Backend Tests
| Test | Result | Notes |
|------|--------|-------|
| Auto-extract hashtags on post create | ✅ | Post `#travel #food #instagood` correctly extracted |
| `GET /api/posts/trending-hashtags/` | ✅ | Returns `travel`, `food`, `instagood` with counts |
| `GET /api/posts/?hashtag=travel` | ✅ | Filters posts correctly |

### Frontend Status
- Trending hashtags display on `SearchScreen`
- Tapping a hashtag navigates to `HashtagResultScreen`
- Grid shows posts matching the selected hashtag

---

## 3. Push Notifications (FCM) 🟡

### Backend Tests
| Test | Result | Notes |
|------|--------|-------|
| `POST /api/users/device-tokens/register/` | ✅ | Token registered successfully |
| FCM notification on Like | ✅ | Backend triggers `send_push_notification()` |
| FCM notification on Comment | ✅ | Backend triggers `send_push_notification()` |
| FCM notification on Follow | ✅ | Backend triggers `send_push_notification()` |

### Frontend Status
- **Expo Go Limitation:** `expo-notifications` remote push was removed from Expo Go in SDK 53+
- App gracefully handles this with a log message instead of crashing
- **To test on real device:** Build a development client with `eas build` or `expo-dev-client`
- Token registration logic is correct and will work in a development build

---

## 4. Reels / Video Support 🟡

### Backend Tests
| Test | Result | Notes |
|------|--------|-------|
| Create reel post (`is_reel=true`) | ✅ | Reel created with ID 4 |
| `GET /api/posts/reels/` | ✅ | Returns reel in paginated list |
| Video file upload | ✅ | `video` field accepts multipart upload |

### Frontend Status
- `ReelsScreen` renders vertical scroll feed
- `CreatePostScreen` supports video picker
- **Expo Go Limitation:** `expo-av` native module is not available in Expo Go for SDK 55
- Added `SafeVideo` component that shows a placeholder instead of crashing
- **To test on real device:** Build a development client with EAS

---

## 5. Direct Messages (WebSockets) ✅

### Backend Tests
| Test | Result | Notes |
|------|--------|-------|
| `WS /ws/chat/?token=<jwt>` connect | ✅ | WebSocket connects via `websockets` Python client |
| Send message via WebSocket | ✅ | Message persisted and echoed to both users |
| `GET /api/messages/history/1/` | ✅ | Returns full conversation history |
| `GET /api/messages/conversations/` | ✅ | Returns latest message per conversation partner |

### Frontend Status
- `MessagesListScreen` groups conversations by partner
- `ChatScreen` connects to WebSocket and sends/receives messages in real-time
- Messages appear immediately after sending
- Navigation to Chat works from Profile and UserProfile screens

---

## 6. Navigation ✅

### Verified Flows
| Flow | Result |
|------|--------|
| Login → Feed | ✅ |
| Feed → Post Detail | ✅ |
| Feed → Comments | ✅ |
| Feed → User Profile | ✅ |
| Search → User Profile | ✅ |
| Search → Hashtag Result | ✅ |
| Profile → Saved Posts | ✅ |
| Profile → Messages List | ✅ |
| Profile → Edit Profile | ✅ |
| User Profile → Chat | ✅ |
| Home → Story Viewer | ✅ |
| Tab bar: Home / Search / Reels / Create / Profile | ✅ |

---

## Known Expo Go Limitations

1. **Push Notifications:** Remote notifications require a development build (not Expo Go)
2. **Video Playback:** `expo-av` requires a development build for native video rendering
3. **Workaround:** Both features gracefully degrade with placeholders/logs instead of crashes

### To Test Everything on Real Device
```bash
# Install expo-dev-client
cd frontend && npx expo install expo-dev-client

# Build development client for Android
npx eas build --platform android --profile development

# Or create a local preview build
npx expo prebuild
cd android && ./gradlew assembleDebug
```

---

## Backend Issues Found & Fixed

| Issue | Fix |
|-------|-----|
| `NameError: name 'DeviceToken' is not defined` in device token register view | Added `DeviceToken` to imports in `apps/users/views.py` |

---

## Git Commits

```
0bbf5f3 fix: handle Expo Go limitations for video and push notifications, fix DeviceToken import
c69d5a9 docs: add team handbooks for PM, Backend, Frontend, DevOps, and QA
fced4c1 feat(frontend): React Native app with auth, feed, stories, reels, DMs, and real-time chat
99d2de3 feat(backend): Django REST API with users, posts, stories, auth, and media uploads
7d263d6 docs: add project README, feature roadmap, and junior dev guide
```

---

## Recommendation

For full end-to-end testing on the S22 Ultra (including video and push notifications), generate a **development build** using EAS. The core app (feed, stories, DMs, bookmarks, hashtags, search) works perfectly in Expo Go.
