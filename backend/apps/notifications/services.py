import os
from django.conf import settings

try:
    import firebase_admin
    from firebase_admin import messaging, credentials
    FCM_AVAILABLE = True
except ImportError:
    FCM_AVAILABLE = False

_fcm_initialized = False


def _init_fcm():
    global _fcm_initialized
    if not FCM_AVAILABLE or _fcm_initialized:
        return
    cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _fcm_initialized = True


def send_push_notification(user, title, body, data=None):
    _init_fcm()
    if not FCM_AVAILABLE or not _fcm_initialized:
        return

    tokens = list(user.device_tokens.values_list('token', flat=True))
    if not tokens:
        return

    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=token,
            )
            messaging.send(message)
        except Exception as e:
            print(f"FCM send error: {e}")
            # Optionally delete invalid tokens here
