# QA Handbook — Instagram Clone

> **Audience:** Junior QA Engineers / Testers  
> **Goal:** Test the app systematically, catch regressions, and report bugs that engineers can act on.

---

## 1. Testing Strategy

| Type | Scope | Tools / Methods |
|------|-------|-----------------|
| Manual | UI/UX flows on real device | Samsung S22 Ultra + Expo Go |
| API | Backend endpoints | cURL / Postman / Swagger UI |
| Regression | Core flows after every change | Checklist (this doc) |
| Exploratory | Edge cases, permissions, network | Ad-hoc on device |

---

## 2. Test Devices & Environment

**Primary Device:** Samsung Galaxy S22 Ultra (Android 14+)
**Network:** Same Wi-Fi as dev Mac, or USB tethered via `adb reverse`
**Backend:** `http://10.34.83.169:8000` (local) or staging domain

**Before every test session:**
1. Confirm backend is running (`curl` health check)
2. Confirm Expo bundler is running
3. Force-stop Expo Go and relaunch fresh
4. Use a clean test account or reset data if needed

---

## 3. Smoke Test Checklist (Run on every release)

### Auth
- [ ] Register new account → lands on Home feed
- [ ] Login with existing account → lands on Home feed
- [ ] Logout → returns to Login screen
- [ ] Kill app and reopen → still logged in (token persisted)

### Feed
- [ ] Feed loads posts from followed users
- [ ] Pull-to-refresh updates feed
- [ ] Scroll to bottom → loads more posts (pagination)
- [ ] Tap username on post → navigates to user profile
- [ ] Double-tap post image → like animation + count increases
- [ ] Tap heart icon → like toggles on/off
- [ ] Tap comment icon → opens Comments screen
- [ ] Tap "View all X comments" → opens Comments screen

### Comments
- [ ] Comment list loads
- [ ] Post a new comment → appears at top
- [ ] Empty comment cannot be submitted

### Stories
- [ ] Stories bar shows active stories from followed users
- [ ] Tap "Your story" → opens CreateStoryScreen
- [ ] Create story with image → success toast
- [ ] Tap another user's story ring → opens StoryViewer
- [ ] Story auto-advances after ~5 seconds
- [ ] Tap left side → previous story; tap right side → next story
- [ ] Hold press → pauses; release → resumes

### Search
- [ ] Type username → results appear within 1 second
- [ ] Clear search → results disappear
- [ ] Tap search result → navigates to profile

### Profile (Self)
- [ ] Profile shows correct post count, followers, following
- [ ] Post grid displays user's posts in 3 columns
- [ ] Tap post in grid → opens PostDetail
- [ ] Tap Edit Profile → bio/website/image can be changed
- [ ] Tap Saved → shows saved posts
- [ ] Tap Messages → shows DM list
- [ ] Tap Followers count → list loads
- [ ] Tap Following count → list loads

### Profile (Other User)
- [ ] Navigate to another user's profile from search/feed
- [ ] Follow button → turns to "Following", count increments
- [ ] Following button → turns to "Follow", count decrements
- [ ] Message button → opens Chat screen
- [ ] Post grid shows only that user's posts

### Saved Posts
- [ ] Tap bookmark icon on post → saved
- [ ] Tap again → unsaved
- [ ] Saved posts screen lists all saved posts

### Hashtags
- [ ] Create post with #hashtag → hashtag extracted
- [ ] Search tab shows trending hashtags
- [ ] Tap hashtag → shows posts with that tag

### Reels / Video
- [ ] Create tab → Pick Video → upload as reel
- [ ] Reels tab shows vertical video feed
- [ ] Video auto-plays when visible, pauses when not

### Push Notifications
- [ ] Like/comment/follow triggers notification (if FCM configured)
- [ ] Device token registers on login

### Direct Messages
- [ ] Open chat from profile Messages button
- [ ] Send message → appears in both sender and recipient
- [ ] Messages list shows latest message per conversation
- [ ] Pull-to-refresh updates conversation list

### Create Post
- [ ] Pick 1+ images from gallery
- [ ] Add caption with hashtags
- [ ] Tap Share → post appears on own profile
- [ ] Post appears in followers' feeds

---

## 4. API Testing (Postman / cURL)

### Auth
```bash
# Login
curl -X POST http://10.34.83.169:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```
**Expected:** `200 OK` with `access` and `refresh` tokens.

### Protected Endpoint (No Token)
```bash
curl -s -o /dev/null -w "%{http_code}" http://10.34.83.169:8000/api/users/me/
```
**Expected:** `401 Unauthorized`

### Feed
```bash
curl -H "Authorization: Bearer <token>" http://10.34.83.169:8000/api/posts/feed/
```
**Expected:** `200 OK`, paginated list of posts.

### Image Upload
Use Postman or `curl -F` to test multipart upload:
```bash
curl -X POST http://10.34.83.169:8000/api/posts/ \
  -H "Authorization: Bearer <token>" \
  -F "caption=Test" \
  -F "images=@/path/to/photo.jpg"
```
**Expected:** `201 Created`

---

## 5. Edge Cases & Exploratory Testing

| Scenario | Expected Behavior |
|----------|-------------------|
| No internet on launch | Graceful error or empty state (not infinite spinner) |
| Backend is down | Network error message in app |
| Upload very large image | Rejected or compressed before upload |
| Rapid double-tap like | No duplicate API calls |
| Scroll feed very fast | Smooth scrolling, no crashes |
| Create post with no images | "Please select at least one image" alert |
| Follow yourself | Backend returns `400 Bad Request` |
| Delete expired story | Not shown in stories bar (24h rule) |

---

## 6. Bug Report Template

When filing a bug, always include:

```markdown
**Title:** [Screen] Brief description

**Steps to Reproduce:**
1. Go to ...
2. Tap ...
3. Enter ...

**Expected Result:**
...

**Actual Result:**
...

**Device:** Samsung S22 Ultra / Android 14
**App Version:** (commit hash or build date)
**Backend URL:** http://10.34.83.169:8000
**Screenshots / Video:** (attach)
**Logs:** (adb logcat or Metro logs)
```

---

## 7. Automated Testing Roadmap

While manual testing covers MVP, plan to add:

### Backend
- **Django tests** in each app (`tests.py` or `tests/` folder)
- Test serializers, views, and model methods
- Run with `python manage.py test`

### Frontend
- **Jest** for unit tests (logic, helpers)
- **React Native Testing Library** for component tests
- **Detox** or **Maestro** for E2E mobile tests

### CI Integration
- Block PRs if tests fail
- Run linting (`flake8`, `eslint`) automatically

---

## 8. Regression Frequency

| Release Type | QA Effort |
|--------------|-----------|
| Hotfix (1 file changed) | Smoke test affected screen only |
| Feature release | Full smoke test checklist |
| Major release | Full smoke test + API tests + exploratory |
