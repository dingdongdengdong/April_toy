# Backend Handbook — Instagram Clone

> **Audience:** Junior Backend Engineers (Django / DRF)  
> **Goal:** Onboard quickly, maintain APIs safely, and extend features without breaking existing clients.

---

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Django 5.x + Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| CORS | django-cors-headers |
| Images | Pillow (PIL) |
| Docs | drf-spectacular (OpenAPI/Swagger) |
| DB (dev) | SQLite |
| DB (prod) | PostgreSQL (psycopg2-binary) |
| Static/Media (prod) | AWS S3 (boto3 + django-storages) |
| WSGI (prod) | Gunicorn + WhiteNoise |

---

## 2. Project Structure

```
backend/
├── April_toy/            # Settings, root URLs, WSGI/ASGI
├── apps/
│   ├── users/            # Custom User, Profile, Follow
│   ├── posts/            # Post, PostImage, Like, Comment
│   ├── stories/          # Story, cleanup command
│   └── notifications/    # Notification model (Phase 2)
├── media/                # Dev uploads (gitignored)
├── requirements/
│   ├── base.txt
│   ├── local.txt
│   └── production.txt
└── manage.py
```

**Rule:** All business logic lives in `apps/`. Never put models or views directly in `April_toy/`.

---

## 3. The Custom User Model

We use `AUTH_USER_MODEL = 'users.User'` which extends `AbstractUser` with:
- `email` (unique, login field)
- `username` (required)
- `created_at`, `updated_at`

**Critical rule:** Because migrations already ran with the custom user, **never** change `AUTH_USER_MODEL`. If you need new user fields, add them to `users.User` and run a normal migration.

---

## 4. API Patterns

### 4.1 Serializers
- **Read serializers** return nested data + computed fields (`likes_count`, `is_liked`, absolute image URLs).
- **Write serializers** are lean and only accept writeable fields.
- **Patch serializers** (e.g., `UserUpdateSerializer`) accept flat fields for multipart uploads.

### 4.2 Views
- Use generic CBVs (`ListCreateAPIView`, `RetrieveDestroyAPIView`) for CRUD.
- Use `APIView` for custom actions (like `FollowToggleView`, `LikeToggleView`).
- Always pass `request` in `get_serializer_context()` when generating absolute URLs.

### 4.3 URL Conventions
```
GET    /api/posts/feed/          # Authenticated feed
GET    /api/posts/               # All posts (public-ish)
POST   /api/posts/               # Create post
GET    /api/posts/<id>/          # Retrieve post
DELETE /api/posts/<id>/          # Delete own post
POST   /api/posts/<id>/like/     # Toggle like
GET    /api/posts/<id>/comments/ # List comments
POST   /api/posts/<id>/comments/ # Add comment
```

**Rule:** Keep resource nesting shallow. No deeper than `/resource/<id>/action/`.

---

## 5. Image Handling

### Development
- Uploaded to `backend/media/`
- Served by Django dev server via `static()` in `urls.py`

### Production
- Use S3 (configured via `django-storages`)
- Never serve user uploads through Django in production
- Consider generating thumbnails on upload

### Serializer Pattern for Absolute URLs
```python
def get_image(self, obj):
    request = self.context.get('request')
    if request and obj.image:
        return request.build_absolute_uri(obj.image.url)
    return obj.image.url if obj.image else None
```

---

## 6. Adding a New App

```bash
cd backend
python manage.py startapp myfeature
mv myfeature apps/
```

1. Add `'apps.myfeature'` to `INSTALLED_APPS` in `settings.py`
2. Create `apps/myfeature/models.py`
3. Run `python manage.py makemigrations myfeature`
4. Run `python manage.py migrate`
5. Create `serializers.py`, `views.py`, `urls.py`
6. Include URLs in `April_toy/urls.py`

---

## 7. Common Tasks

### Run server for mobile testing
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Create superuser
```bash
python manage.py createsuperuser
```

### Delete expired stories (cron job)
```bash
python manage.py cleanup_expired_stories
```
**Recommended:** Run this via `cron` every hour or use Celery Beat.

### Reset database (nuclear option)
```bash
rm backend/db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## 8. Security Checklist

- [ ] `DEBUG = False` in production
- [ ] `SECRET_KEY` loaded from env, never committed
- [ ] `ALLOWED_HOSTS` explicitly set
- [ ] `CORS_ALLOWED_ORIGINS` restricted (never `CORS_ALLOW_ALL_ORIGINS = True` in prod)
- [ ] File upload size limited (add validator)
- [ ] Rate limiting on auth endpoints (e.g., `django-ratelimit`)
- [ ] Pagination on all list endpoints
- [ ] Use `select_related` / `prefetch_related` to avoid N+1 queries

---

## 9. Debugging Tips

### Check JWT token
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"pass"}'
```

### Query optimization
Add `django-debug-toolbar` (in `requirements/local.txt`) and watch for duplicate queries.

### N+1 example (bad)
```python
for post in Post.objects.all():
    print(post.author.username)  # N+1!
```

### N+1 fix (good)
```python
for post in Post.objects.select_related('author').all():
    print(post.author.username)
```

### Recently Added Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/posts/saved/` | List user's saved posts |
| `POST /api/posts/<id>/bookmark/` | Toggle save/unsave |
| `GET /api/posts/trending-hashtags/` | Top hashtags by usage |
| `GET /api/posts/reels/` | List video reels |
| `GET /api/messages/conversations/` | DM conversation list |
| `GET /api/messages/history/<user_id>/` | DM history with user |
| `WS /ws/chat/?token=<jwt>` | Real-time chat WebSocket |
| `POST /api/users/device-tokens/register/` | Register FCM push token |

---

## 10. Extending the API

When adding a new endpoint:
1. Write the serializer first
2. Add the view with correct `permission_classes`
3. Wire up the URL
4. Test with `curl` or Swagger UI (`/api/docs/`)
5. Only then update the frontend
