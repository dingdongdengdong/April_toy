# Instagram Clone — v1 MVP Completion Plan

> **Branch:** `v1`  
> **Goal:** Close the remaining gaps so the app feels like a complete Instagram MVP.  
> **Scope:** Backend API polish + Frontend UX completion. No new major features (no camera, no filters, no dark mode).

---

## Legend

- ✅ = Already implemented
- 🚧 = In progress / needs polish
- ⬜ = Missing — **target for v1**

---

## Milestone 1: Notifications (In-App Notification Center)

**Why:** Push notifications are already wired, but users have no way to view notification history inside the app. This is a core Instagram feature.

### Backend Tasks
| Task | Status | File |
|------|--------|------|
| Create `NotificationSerializer` | ⬜ | `backend/apps/notifications/serializers.py` |
| Create `NotificationListView` (GET, paginated, unread-first) | ⬜ | `backend/apps/notifications/views.py` |
| Create `MarkNotificationReadView` (POST `/<id>/read/`) | ⬜ | `backend/apps/notifications/views.py` |
| Create `MarkAllNotificationsReadView` (POST `/read-all/`) | ⬜ | `backend/apps/notifications/views.py` |
| Wire URLs under `/api/notifications/` | ⬜ | `backend/apps/notifications/urls.py` |
| Ensure FCM triggers also create `Notification` rows | ✅ | Already done in users/posts views |

### Frontend Tasks
| Task | Status | File |
|------|--------|------|
| Create `NotificationsScreen.js` | ⬜ | `frontend/src/screens/NotificationsScreen.js` |
| Add notifications tab / navigation entry | ⬜ | `frontend/src/navigation/AppNavigator.js` |
| Add unread badge on tab icon | ⬜ | `frontend/src/navigation/AppNavigator.js` |
| Poll or refresh on focus | ⬜ | `frontend/src/screens/NotificationsScreen.js` |

---

## Milestone 2: Multi-Image Carousel in Feed & Detail

**Why:** Posts can have multiple images, but `PostCard` and `PostDetailScreen` only show the first one. Instagram is all about carousels.

### Frontend Tasks
| Task | Status | File |
|------|--------|------|
| Add horizontal `FlatList` / `ScrollView` with paging in `PostCard` | ⬜ | `frontend/src/components/PostCard.js` |
| Add pagination dots (image count indicator) | ⬜ | `frontend/src/components/PostCard.js` |
| Update `PostDetailScreen` to show all images with swipe | ⬜ | `frontend/src/screens/PostDetailScreen.js` |
| Keep double-tap-to-like working on carousel | ⬜ | `frontend/src/components/PostCard.js` |

---

## Milestone 3: Video Playback in Feed

**Why:** Video posts in the feed currently show a static play-button placeholder. Users expect inline video playback (muted, auto-play on visible).

### Frontend Tasks
| Task | Status | File |
|------|--------|------|
| Replace static placeholder with `expo-av` `Video` in `PostCard` | ⬜ | `frontend/src/components/PostCard.js` |
| Mute by default, show unmute toggle | ⬜ | `frontend/src/components/PostCard.js` |
| Pause when not visible (performance) | ⬜ | `frontend/src/components/PostCard.js` |

---

## Milestone 4: Delete Post

**Why:** Backend endpoint exists (`DELETE /api/posts/<id>/`), but there is no UI to delete your own posts.

### Frontend Tasks
| Task | Status | File |
|------|--------|------|
| Add "Delete" option (author only) in `PostDetailScreen` | ⬜ | `frontend/src/screens/PostDetailScreen.js` |
| Confirm with `Alert.alert` before delete | ⬜ | `frontend/src/screens/PostDetailScreen.js` |
| Navigate back & refresh feed on success | ⬜ | `frontend/src/screens/PostDetailScreen.js` |

---

## Milestone 5: Engineering Polish

| Task | Status | File |
|------|--------|------|
| Centralize API base URL in one config file | ⬜ | `frontend/src/config/api.js` |
| Remove unused `date-fns`, `@tanstack/react-query` deps or start using them | ⬜ | `frontend/package.json` |
| Fix `PostCard` avatar to use `author.profile_image` if available | ⬜ | `frontend/src/components/PostCard.js` |
| Profile grid avatars (gray circles → real images) | ⬜ | `frontend/src/screens/ProfileScreen.js`, `UserProfileScreen.js` |

---

## v1 Definition of Done

- [ ] User can open a Notifications tab and see a chronological list of likes, comments, follows, mentions.
- [ ] User can tap a notification to navigate to the relevant post or profile.
- [ ] User can mark individual or all notifications as read.
- [ ] Multi-image posts show all images with swipe pagination in feed and detail.
- [ ] Video posts play inline in the feed (muted).
- [ ] Author can delete their own posts from `PostDetailScreen`.
- [ ] No hardcoded API URLs scattered across the frontend.
- [ ] Backend passes basic smoke test (Django server starts, migrations OK).
- [ ] Frontend starts without Metro bundler errors.

---

## Out of Scope (v2 / Future)

- Camera capture (currently gallery-only)
- Image filters / editing
- Dark mode
- Story replies
- Share posts externally
- React Query migration
- Unit / integration tests
- PostgreSQL / Redis / S3 production setup
