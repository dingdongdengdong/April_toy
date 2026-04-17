# Instagram Clone - Full Stack Development Guide

> **Project:** April_toy (Instagram Clone)  
> **Stack:** Django REST Framework (Backend) + React Native (Frontend)  
> **Dev OS:** macOS  
> **Test Device:** Real Android (Samsung Galaxy S22 Ultra)  
> **Target Audience:** Junior Developers (Maintenance & Onboarding)

---

## 1. Project Architecture Overview

```
April_toy/
├── backend/                    # Django Project Root
│   ├── April_toy/              # Project Config (settings, urls, wsgi, asgi)
│   ├── apps/
│   │   ├── users/              # Auth, Profiles, Followers
│   │   ├── posts/              # Posts, Images, Likes, Comments
│   │   ├── stories/            # Stories (24h content)
│   │   └── notifications/      # Push / In-app notifications
│   ├── media/                  # User uploads (dev only)
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── local.txt
│   │   └── production.txt
│   ├── templates/
│   ├── manage.py
│   └── .env.example
├── frontend/                   # React Native (Expo) Project
│   ├── src/
│   │   ├── api/                # Axios interceptors & endpoints
│   │   ├── components/         # Reusable UI components
│   │   ├── screens/            # App screens
│   │   ├── navigation/         # React Navigation setup
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Global state (AuthContext, etc.)
│   │   └── utils/              # Helpers, constants
│   ├── App.js
│   └── package.json
├── docs/                       # API docs, ERD, deployment guides
├── .venv/                      # Python virtual environment
└── INSTAGRAM_CLONE_GUIDE.md   # This document
```

---

## 2. Tech Stack & Necessary Packages

### 2.1 Backend (Django REST Framework)

| Package | Purpose |
|---------|---------|
| `djangorestframework` | Core REST API framework |
| `django-cors-headers` | Handle CORS for React Native app |
| `djangorestframework-simplejwt` | JWT Authentication |
| `Pillow` | Image processing (resize, thumbnails) |
| `django-filter` | Advanced queryset filtering |
| `python-dotenv` | Environment variable management |
| `psycopg2-binary` | PostgreSQL adapter (use in prod) |
| `dj-database-url` | Database config from URL |
| `whitenoise` | Serve static/media files |
| `gunicorn` | WSGI HTTP server (prod) |
| `boto3` + `django-storages` | AWS S3 for image storage (prod) |
| `drf-yasg` / `drf-spectacular` | API documentation (Swagger/OpenAPI) |

#### Install (backend)
```bash
cd backend
pip install djangorestframework django-cors-headers \
    djangorestframework-simplejwt Pillow django-filter \
    python-dotenv psycopg2-binary dj-database-url \
    whitenoise gunicorn boto3 django-storages
```

### 2.2 Frontend (React Native with Expo)

| Package | Purpose |
|---------|---------|
| `expo` | React Native toolchain |
| `@react-navigation/native` | Navigation core |
| `@react-navigation/stack` | Stack navigator |
| `@react-navigation/bottom-tabs` | Tab navigator (Home, Search, Reels, Profile) |
| `axios` | HTTP client |
| `@react-native-async-storage/async-storage` | Store JWT tokens locally |
| `expo-image-picker` | Pick images from gallery/camera |
| `expo-image-manipulator` | Resize/compress images before upload |
| `react-native-vector-icons` / `@expo/vector-icons` | Icons |
| `react-native-gesture-handler` | Gestures (double-tap like, etc.) |
| `react-native-reanimated` | Smooth animations |
| `socket.io-client` | Real-time features (optional) |
| `date-fns` | Date formatting |
| `react-query` or `@tanstack/react-query` | Server state management |

#### Install (frontend)
```bash
npx create-expo-app frontend
cd frontend
npx expo install @react-navigation/native \
    @react-navigation/stack @react-navigation/bottom-tabs \
    @react-native-async-storage/async-storage \
    expo-image-picker expo-image-manipulator \
    react-native-gesture-handler react-native-reanimated

npm install axios date-fns @tanstack/react-query socket.io-client
```

---

## 3. Django Backend Structure

### 3.1 Apps Breakdown

#### `users` app
- **Custom User model** (extend `AbstractUser` early!)
- **Profile model** (`bio`, `profile_image`, `website`)
- **Follow model** (M2M through model: `follower` -> `following`)
- **Endpoints:**
  - `POST /api/auth/register/`
  - `POST /api/auth/login/` (JWT)
  - `POST /api/auth/refresh/`
  - `GET /api/users/me/`
  - `PATCH /api/users/me/`
  - `POST /api/users/<id>/follow/`
  - `GET /api/users/<id>/followers/`
  - `GET /api/users/<id>/following/`

#### `posts` app
- **Post model** (`author` FK, `caption`, `created_at`)
- **PostImage model** (`post` FK, `image`, `order`)
- **Like model** (`user` FK, `post` FK, unique_together)
- **Comment model** (`user` FK, `post` FK, `text`, `created_at`)
- **Endpoints:**
  - `GET /api/posts/` (feed, paginated)
  - `POST /api/posts/` (create post with images)
  - `GET /api/posts/<id>/`
  - `DELETE /api/posts/<id>/`
  - `POST /api/posts/<id>/like/`
  - `GET /api/posts/<id>/comments/`
  - `POST /api/posts/<id>/comments/`

#### `stories` app (Phase 2)
- **Story model** (`user` FK, `media`, `created_at`, `expires_at`)
- Auto-delete stories older than 24h via management command or celery beat.

### 3.2 Key Settings (`settings.py`)

```python
INSTALLED_APPS = [
    # Django default apps...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Your apps
    'apps.users',
    'apps.posts',
    'apps.stories',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}

# CORS - VERY IMPORTANT for React Native
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",     # Metro bundler
    "http://192.168.x.x:8081",   # Your phone (adjust)
]

# Media files (dev)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# For production, use S3 or similar. NEVER serve user uploads via Django in production.
```

### 3.3 Custom User Model (CRITICAL)

**Do this BEFORE your first migration.** If you migrate without it, changing later is painful.

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    # Add fields if needed
```

```python
# settings.py
AUTH_USER_MODEL = 'users.User'
```

---

## 4. React Native Frontend Structure

### 4.1 Navigation Structure (Instagram-like)

```
App
└── NavigationContainer
    └── AuthContext check
        ├── AuthStack (not logged in)
        │   ├── LoginScreen
        │   └── RegisterScreen
        └── MainTabNavigator (logged in)
            ├── HomeStack
            │   └── FeedScreen
            ├── SearchStack
            │   └── SearchScreen
            ├── CreatePostStack (modal)
            │   └── CreatePostScreen
            ├── ReelsStack (placeholder)
            └── ProfileStack
                └── ProfileScreen
```

### 4.2 API Layer Pattern

Create a reusable Axios instance with JWT interceptor:

```javascript
// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://YOUR_MAC_IP:8000/api'; // See Section 6

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## 5. Instagram Clone Core Features Checklist

### Phase 1: MVP
- [ ] User registration / login (JWT)
- [ ] Create post (1+ images, caption)
- [ ] Home feed (posts from followed users, chronological)
- [ ] Like / Unlike post (with optimistic UI update)
- [ ] Comment on post
- [ ] User profile (posts grid, bio, follower/following count)
- [ ] Follow / Unfollow user

### Phase 2: Enhancements
- [ ] Stories (24h auto-expire)
- [ ] Explore page (search users, trending posts)
- [ ] Push notifications (new follower, like, comment)
- [ ] Direct Messages (WebSockets or polling)
- [ ] Image cropping / filtering
- [ ] Infinite scroll pagination

---

## 6. macOS + Real Android (S22 Ultra) Dev Setup

### 6.1 Enable USB Debugging on S22 Ultra
1. Go to **Settings → About phone → Software information**
2. Tap **Build number** 7 times to enable Developer Options
3. Go to **Settings → Developer options**
4. Turn on **USB debugging**
5. Connect USB cable to Mac
6. On phone, allow RSA fingerprint when prompted

### 6.2 Install Android Platform Tools on Mac

```bash
# Via Homebrew
brew install android-platform-tools

# Verify device is connected
adb devices
# Should show: xxxxxxx    device
```

### 6.3 Run React Native on Real Device

#### Option A: USB Connection (Recommended)
```bash
cd frontend
npx expo start
# In the terminal, press 'a' to open on Android
# Or scan QR code with Expo Go app
```

#### Option B: Expo Go App
1. Install **Expo Go** from Google Play Store
2. Ensure Mac and phone are on **same Wi-Fi**
3. Run `npx expo start` and scan QR code

### 6.4 Connect React Native to Django Backend

**This is the #1 issue for beginners.**

React Native running on a physical device **cannot** use `localhost:8000` because `localhost` refers to the phone itself, not your Mac.

Use your Mac's **local network IP address**:

```bash
# Get your Mac's IP
ipconfig getifaddr en0
# Example output: 192.168.1.42
```

Set this in your React Native API client:
```javascript
const API_URL = 'http://192.168.1.42:8000/api';
```

Run Django with this IP:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

Add your Mac's IP to Django `ALLOWED_HOSTS`:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '192.168.1.42']
```

### 6.5 Image Upload Testing on Real Device

When uploading images from the phone gallery/camera, use `FormData`:

```javascript
const formData = new FormData();
formData.append('caption', caption);
images.forEach((img, index) => {
  formData.append(`images`, {
    uri: img.uri,
    name: `photo_${index}.jpg`,
    type: 'image/jpeg',
  });
});

await apiClient.post('/posts/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

**Important:** For Android API 29+, file URIs may need `FileSystem` copy:
```javascript
import * as FileSystem from 'expo-file-system';
const fileInfo = await FileSystem.getInfoAsync(imageUri);
```

---

## 7. Image Handling Strategy

### 7.1 Backend: Thumbnails + Storage

For an Instagram clone, image optimization is crucial.

**Development:** Store in `media/` folder, served by Django dev server.

**Production:**
- Store originals on **AWS S3** or similar
- Generate thumbnails on upload (e.g., 300x300 for grid, 1080x1080 for feed)
- Consider using **django-imagekit** or custom `save()` override with Pillow

Example thumbnail generation:
```python
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

def generate_thumbnail(image_field, size=(300, 300)):
    img = Image.open(image_field)
    img.thumbnail(size)
    thumb_io = BytesIO()
    img.save(thumb_io, format='JPEG', quality=85)
    return ContentFile(thumb_io.getvalue(), name=f"thumb_{image_field.name}")
```

### 7.2 Frontend: Pre-upload Compression

Compress images before upload to save bandwidth:

```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const compressed = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1080 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
```

---

## 8. Security Checklist for Junior Devs

- [ ] **Never commit `.env` files or `SECRET_KEY`**
- [ ] **Use HTTPS in production** (Let's Encrypt)
- [ ] **Validate file types** on upload (only jpg/png/webp)
- [ ] **Limit file size** on upload (max 10MB per image)
- [ ] **Use pagination** on all list endpoints (prevent DB overload)
- [ ] **Rate limit** sensitive endpoints (login, follow)
- [ ] **Sanitize user input** (Django ORM does this well, but validate in serializers)
- [ ] **Store JWT securely** (AsyncStorage is okay for MVP, but consider Keychain/Keystore later)
- [ ] **CORS:** Never use `CORS_ALLOW_ALL_ORIGINS = True` in production

---

## 9. Database Migration Rules

Since we're using a custom User model, follow this strictly:

1. **Create custom User model BEFORE first migration.**
2. Run:
   ```bash
   python manage.py makemigrations users
   python manage.py migrate
   ```
3. For every new app:
   ```bash
   python manage.py startapp <app_name>
   # Move to apps/<app_name>
   # Add to INSTALLED_APPS
   # Create models
   python manage.py makemigrations <app_name>
   python manage.py migrate
   ```

---

## 10. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `Network Error` in RN | Wrong backend IP / firewall | Use Mac IP + same Wi-Fi |
| `CORS error` | Missing `corsheaders` or wrong origin | Add phone IP to `CORS_ALLOWED_ORIGINS` |
| Image upload fails | Missing `multipart/form-data` header | Set header explicitly in axios |
| `adb devices` shows `unauthorized` | Phone rejected RSA prompt | Revoke USB auth in dev options, reconnect |
| Slow feed loading | N+1 query on images/likes | Use `select_related()` / `prefetch_related()` |
| `AbstractBaseUser` migration error | Changed User model after initial migration | Reset DB or use complex migration (painful) |

---

## 11. Deployment Overview (High-Level)

### Backend
1. Use **PostgreSQL** (Render, Railway, AWS RDS)
2. Use **Gunicorn** + **Nginx**
3. Store media on **AWS S3**
4. Environment variables for all secrets

### Frontend
1. Build with `eas build` (Expo Application Services)
2. Or eject and build APK/AAB with Android Studio
3. Update API_URL to production domain

---

## 12. Quick Start Commands

```bash
# 1. Backend setup
cd /Users/dong/PycharmProjects/April_toy
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/local.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

# 2. Frontend setup
cd /Users/dong/PycharmProjects/April_toy/frontend
npx expo start
# Press 'a' for Android device
```

---

**Document Owner:** Senior Full Stack Dev  
**Last Updated:** 2026-04-16  
**Next Review:** After Phase 1 MVP completion
