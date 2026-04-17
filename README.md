# Instagram Clone

> Django REST Framework + React Native (Expo)

## Quick Start

### 1. Backend

```bash
# Activate venv
source .venv/bin/activate

# Packages are already installed. If not:
pip install -r backend/requirements/base.txt

# Run server (bind to 0.0.0.0 for mobile access)
cd backend
python manage.py runserver 0.0.0.0:8000
```

- API Docs: http://127.0.0.1:8000/api/docs/
- Admin: http://127.0.0.1:8000/admin/ (admin / admin123)

### 2. Frontend

```bash
cd frontend
# If Expo project not initialized yet:
npx create-expo-app . --template blank
npx expo start --localhost
# Or for Wi-Fi/LAN:
# npx expo start --lan
```

### 3. Mobile Connection (Recommended: USB + adb reverse)

For the most reliable connection with a real Android device over USB:

```bash
# 1. Forward Metro bundler port to phone
adb reverse tcp:8081 tcp:8081

# 2. Forward Django API port to phone (optional but convenient)
adb reverse tcp:8000 tcp:8000

# 3. Run Expo with --localhost so phone connects through USB tunnel
cd frontend
npx expo start --localhost
```

If using Wi-Fi instead:
1. Find your Mac IP: `ipconfig getifaddr en0`
2. Update `frontend/src/api/client.js` with that IP
3. Add the IP to `backend/.env` in `DJANGO_ALLOWED_HOSTS` and `CORS_EXTRA_ORIGINS`
4. Ensure phone and Mac are on the **same Wi-Fi**

## Docs

- [INSTAGRAM_CLONE_GUIDE.md](./INSTAGRAM_CLONE_GUIDE.md) — Full architecture, packages, and junior-dev maintenance guide.
- [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) — Feature checklist and implementation roadmap.
- [docs/PM_DESIGNER_HANDBOOK.md](./docs/PM_DESIGNER_HANDBOOK.md) — For PMs & Designers
- [docs/BACKEND_HANDBOOK.md](./docs/BACKEND_HANDBOOK.md) — For Backend Engineers
- [docs/FRONTEND_HANDBOOK.md](./docs/FRONTEND_HANDBOOK.md) — For Frontend Engineers
- [docs/DEVOPS_HANDBOOK.md](./docs/DEVOPS_HANDBOOK.md) — For DevOps / Platform Engineers
- [docs/QA_HANDBOOK.md](./docs/QA_HANDBOOK.md) — For QA Engineers
