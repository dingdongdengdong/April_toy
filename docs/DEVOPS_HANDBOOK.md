# DevOps Handbook — Instagram Clone

> **Audience:** Junior DevOps / SRE / Platform Engineers  
> **Goal:** Deploy, monitor, and secure the infrastructure for this mobile app.

---

## 1. Environments

| Env | Purpose | Domain Example |
|-----|---------|----------------|
| Local | Dev on Mac + real Android | `http://10.34.83.169:8000` |
| Staging | Pre-prod testing | `https://api-staging.example.com` |
| Production | Live users | `https://api.example.com` |

---

## 2. Local Dev Setup (macOS)

### Backend
```bash
cd /Users/dong/PycharmProjects/April_toy
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements/local.txt
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend (with real Android over USB)
```bash
# Forward ports
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000

# Run Expo
cd frontend
npx expo start --localhost
```

### Why `0.0.0.0`?
Django's default `127.0.0.1` only accepts local connections. `0.0.0.0` allows the phone to reach it.

---

## 3. Environment Variables

Create `backend/.env` (never commit this):

```env
DJANGO_SECRET_KEY=<random-50-char-string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.example.com
CORS_EXTRA_ORIGINS=https://your-expo-domain.com

# Database (production)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=ap-northeast-2
```

**Security rules:**
- `.env` and `db.sqlite3` are in `.gitignore`
- Production secrets must come from a vault (e.g., AWS Secrets Manager, HashiCorp Vault)
- Never log secrets or tokens

---

## 4. Production Deployment (Backend)

### Recommended Stack
- **Host:** AWS EC2, Railway, Render, or Fly.io
- **App Server:** Gunicorn
- **Reverse Proxy:** Nginx
- **Static/Media:** AWS S3 + CloudFront
- **DB:** PostgreSQL (RDS or managed)
- **SSL:** Let's Encrypt (certbot)

### Nginx snippet
```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
        alias /var/www/media/;  # or proxy to S3
    }
}
```

### Gunicorn startup
```bash
gunicorn April_toy.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Cron job for expired stories
```bash
0 * * * * cd /var/www/backend && source ../.venv/bin/activate && python manage.py cleanup_expired_stories >> /var/log/cleanup_stories.log 2>&1
```

---

## 5. Frontend Deployment (React Native)

### Expo Application Services (EAS) — Recommended
```bash
cd frontend
npm install -g eas-cli
eas build --platform android --profile production
```

This produces an `.aab` or `.apk` you can distribute via Play Store or internal testing.

### Before building production:
1. Update `src/api/client.js` to point to the production API domain
2. Remove debug code (`console.log`, `Alert` in API errors)
3. Set `expo.updates.checkAutomatically` if using OTA updates

---

## 6. CI/CD Pipeline (GitHub Actions Example)

```yaml
name: CI
on: [push]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/requirements/base.txt
      - run: cd backend && python manage.py check
      # - run: cd backend && python manage.py test

  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      # - run: cd frontend && npx eslint .
```

**Recommended additions:**
- Run backend tests on every PR
- Build APK on `main` branch merges
- Deploy backend to staging automatically on merge

---

## 7. Monitoring & Logging

### Django Logging
Add to `settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/app.log',
            'maxBytes': 1024*1024*5,
            'backupCount': 3,
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Error Tracking
Integrate Sentry for both backend and frontend:
```python
# backend settings
import sentry_sdk
sentry_sdk.init(dsn=os.getenv('SENTRY_DSN'))
```

### Health Check Endpoint
Add a simple view returning `200 OK` so load balancers can verify uptime.

---

## 8. Security Hardening Checklist

- [ ] HTTPS only (HSTS headers)
- [ ] Secrets in env / vault (never in repo)
- [ ] DB credentials rotated regularly
- [ ] S3 bucket is private; presigned URLs for media if needed
- [ ] Rate limiting on auth endpoints
- [ ] Django `SECURE_SSL_REDIRECT = True`
- [ ] `X_FRAME_OPTIONS = 'DENY'`
- [ ] Regular dependency audits (`pip-audit`, `npm audit`)
- [ ] Backups: DB daily, S3 versioning enabled

---

## 9. Scaling Checklist

| Scale Signal | Action |
|--------------|--------|
| CPU > 70% | Increase Gunicorn workers or use autoscaling |
| DB slow queries | Add indexes, upgrade RDS tier |
| Media bandwidth high | Move to CloudFront CDN |
| S3 costs rising | Enable lifecycle rules for old media |
| Feed latency high | Add Redis caching for popular posts |

---

## 10. Disaster Recovery

1. **DB backup:** Automated daily snapshots (RDS) or `pg_dump` cron
2. **Media backup:** S3 cross-region replication
3. **Runbook:**
   - App down → check Gunicorn → check Nginx → check DB connectivity
   - 500 errors → check Sentry → check recent deploy → rollback if needed
   - High latency → check slow query log → check CPU/memory metrics
