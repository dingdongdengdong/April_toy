# Instagram Clone — Feature Roadmap & Junior Dev Guide

> **Goal:** Make the app feel like a real Instagram MVP.  
> **Last Updated:** 2026-04-16

---

## Legend
- ✅ = Implemented
- 🚧 = Partially Implemented / Placeholder
- ⬜ = Not Yet Implemented

---

## Phase 1: MVP (Must-Have for "Real Instagram" Feel)

### 1. Authentication
| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Login | ✅ | JWT-based |
| Registration | ✅ | Auto-creates Profile |
| Token Refresh | ✅ | Silent refresh via Axios interceptor |
| Logout | ✅ | Clears AsyncStorage |

### 2. Feed (Home)
| Feature | Status | Notes |
|---------|--------|-------|
| Post list with images | ✅ | Basic FlatList |
| Pull-to-refresh | ✅ | Wired with `RefreshControl` |
| Infinite scroll pagination | ✅ | `onEndReached` with `ListFooterComponent` loading indicator |
| **Like / Unlike** | ✅ | Heart button + double-tap to like with animated overlay |
| **Comments preview** | ✅ | Tap comment icon or "View all X comments" |
| **Post detail view** | ✅ | `PostDetailScreen` with full image + caption |
| **Stories horizontal bar** | ✅ | Real data from `/api/stories/` |
| Optimistic UI updates | ⬜ | Update like/comment counts immediately before API confirm |

### 3. Post Creation
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-image picker | ✅ | Gallery pick + compression |
| Caption input | ✅ | Basic TextInput |
| Image upload to Django | ✅ | `multipart/form-data` via cache URI |
| Location tag | ⬜ | Easy to add to caption or separate field |
| Camera capture | ⬜ | Can use `launchCameraAsync` later |

### 4. Profile
| Feature | Status | Notes |
|---------|--------|-------|
| View own profile | ✅ | Grid of posts, stats |
| Edit profile (bio, image) | ✅ | `EditProfileScreen` with bio/website/image upload |
| **Follow / Unfollow others** | ✅ | Follow button on `UserProfileScreen` |
| **View other users' profiles** | ✅ | `UserProfileScreen` navigable from search/feed |
| Followers / Following lists | ✅ | `FollowersListScreen` + `FollowingListScreen` |

### 5. Search / Explore
| Feature | Status | Notes |
|---------|--------|-------|
| **User search** | ✅ | `SearchScreen` with debounced query + `UserSearchView` |
| **Suggested users** | ⬜ | Random active users endpoint |
| Trending posts / hashtags | ⬜ | Future enhancement |

### 6. Social Interactions
| Feature | Status | Notes |
|---------|--------|-------|
| Like post | ✅ | Optimistic update in `PostCard` |
| Comment on post | ✅ | `CommentsScreen` with input bar |
| Follow user | ✅ | Follow toggle on profile screens |
| Receive push notifications | 🚧 | Model exists; FCM integration needed |

### 7. Stories (24h Ephemeral Content)
| Feature | Status | Notes |
|---------|--------|-------|
| Create story | ✅ | `CreateStoryScreen` + `StoryListCreateView` |
| **Saved posts** | ✅ | `SavedPost` model + `BookmarkToggleView` + `SavedPostsScreen` |
| **Hashtags** | ✅ | Auto-extracted from captions + trending search + `HashtagResultScreen` |
| **Push Notifications** | ✅ | FCM via `firebase-admin` + `expo-notifications` + device token registration |
| **Reels / Video** | ✅ | `video` field on Post + `ReelsScreen` with `expo-av` + Create tab video upload |
| **Direct Messages** | ✅ | Django Channels WebSocket consumer + `ChatScreen` + `MessagesListScreen` |
| View stories bar | ✅ | Tap ring → `StoryViewerScreen` |
| Auto-delete expired stories | ✅ | `cleanup_expired_stories` management command |
| **Post as Reel toggle** | ✅ | Create tab supports `is_reel=true` with video upload |

---

## Phase 2: Polish & Growth

| Feature | Priority | Notes |
|---------|----------|-------|
| Push Notifications (FCM) | High | New follower, like, comment |
| Direct Messages | Medium | WebSockets or polling |
| Reels / Video support | Low | `expo-av` for video playback |
| Image filters / editing | Low | `expo-gl` or third-party lib |
| Hashtag search | Medium | Regex extract `#tags` from captions |
| Save posts (bookmarks) | Medium | `SavedPost` model |
| Share posts externally | Low | `expo-sharing` |
| Dark mode | Low | Theme context |

---

## Backend Endpoints Status

| Endpoint | Implemented | Frontend Used |
|----------|-------------|---------------|
| `POST /api/auth/login/` | ✅ | ✅ |
| `POST /api/auth/refresh/` | ✅ | ✅ (interceptor) |
| `POST /api/users/register/` | ✅ | ✅ |
| `GET /api/users/me/` | ✅ | ✅ |
| `PATCH /api/users/me/` | ✅ | ⬜ (no edit profile UI yet) |
| `GET /api/users/profile/<username>/` | ✅ | ✅ (own profile only) |
| `POST /api/users/<id>/follow/` | ✅ | ⬜ |
| `GET /api/users/<id>/followers/` | ✅ | ⬜ |
| `GET /api/users/<id>/following/` | ✅ | ⬜ |
| `GET /api/posts/feed/` | ✅ | ✅ |
| `GET /api/posts/` | ✅ | ✅ (profile grid) |
| `POST /api/posts/` | ✅ | ✅ |
| `GET /api/posts/<id>/` | ✅ | ⬜ |
| `DELETE /api/posts/<id>/` | ✅ | ⬜ |
| `POST /api/posts/<id>/like/` | ✅ | ⬜ |
| `GET /api/posts/<id>/comments/` | ✅ | ✅ |
| `POST /api/posts/<id>/comments/` | ✅ | ✅ |
| `GET /api/stories/` | ✅ | ✅ |
| `POST /api/stories/` | ✅ | ✅ |
| `GET /api/stories/me/` | ✅ | ✅ |
| `GET /api/posts/saved/` | ✅ | ✅ |
| `POST /api/posts/<id>/bookmark/` | ✅ | ✅ |
| `GET /api/posts/trending-hashtags/` | ✅ | ✅ |
| `GET /api/posts/reels/` | ✅ | ✅ |
| `GET /api/messages/conversations/` | ✅ | ✅ |
| `GET /api/messages/history/<user_id>/` | ✅ | ✅ |
| `WS /ws/chat/?token=<jwt>` | ✅ | ✅ |
| `POST /api/users/device-tokens/register/` | ✅ | ✅ |

---

## Recommended Implementation Order (Next 3 Sprints)

### Sprint A: Make Feed Feel Real
1. Add **Like button** + **double-tap to like** gesture on each post card
2. Add **comment icon + count** that opens a **Comments screen**
3. Add **Stories bar placeholder** at top of Feed
4. Wire **pull-to-refresh** and **infinite scroll pagination**

### Sprint B: Connect People
1. Build **Search screen** (search users by username)
2. Build **User Profile screen** for other users
3. Add **Follow/Unfollow button** on profiles
4. Build **Followers / Following list screens**

### Sprint C: Self Expression
1. Build **Edit Profile screen** (bio, profile image)
2. Add **Post Detail screen** (full image carousel, all comments)
3. Add **Delete post** option (author only)

---

## UI/UX Guidelines for Junior Devs

### Instagram-like Patterns
- **Double-tap image → Like** with a heart animation overlay.
- **Heart icon** in action bar: outline = not liked, filled red = liked.
- **Comment icon** opens bottom sheet or new screen.
- **Profile grid** is always 3 columns, square aspect ratio.
- **Stories** are circles with gradient borders at the top.
- **Search** should have a top search bar with instant results.

### Performance Rules
- Use `React.memo` for post cards in feed (prevents re-render on scroll).
- Compress images **before** upload (`expo-image-manipulator`).
- Use `keyExtractor` properly in all FlatLists.
- Paginate everything; never fetch unbounded lists.

### Image URLs
All image URLs now return **absolute URLs** from the backend:
```json
"image": "http://10.34.83.169:8000/media/posts/2026/04/test.jpg"
```
This means `<Image source={{ uri: imageUrl }} />` works directly on mobile.

---

## Security / DevOps Reminders
- Keep `CORS_EXTRA_ORIGINS` and `ALLOWED_HOSTS` updated with your Mac IP.
- Run Django with `python manage.py runserver 0.0.0.0:8000` for mobile access.
- Run Expo with `npx expo start --lan` so your phone can reach Metro.
- Do **not** commit `backend/.env` to Git.
