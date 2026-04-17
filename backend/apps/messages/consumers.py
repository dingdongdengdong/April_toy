import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await self.get_user_from_token()
        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'send_message':
            recipient_id = data.get('recipient_id')
            text = data.get('text')
            message = await self.create_message(recipient_id, text)
            if message:
                payload = {
                    'type': 'chat_message',
                    'message': {
                        'id': message.id,
                        'sender_id': message.sender_id,
                        'recipient_id': message.recipient_id,
                        'text': message.text,
                        'created_at': message.created_at.isoformat(),
                    }
                }
                # Send to recipient
                await self.channel_layer.group_send(f"user_{recipient_id}", payload)
                # Echo to sender
                await self.channel_layer.group_send(f"user_{self.user.id}", payload)

        elif action == 'mark_read':
            message_id = data.get('message_id')
            await self.mark_message_read(message_id)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            query_string = self.scope['query_string'].decode()
            token = None
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=')[1]
                    break
            if token:
                access = AccessToken(token)
                return User.objects.get(id=access['user_id'])
        except Exception:
            pass
        return AnonymousUser()

    @database_sync_to_async
    def create_message(self, recipient_id, text):
        try:
            recipient = User.objects.get(id=recipient_id)
            return Message.objects.create(sender=self.user, recipient=recipient, text=text)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_message_read(self, message_id):
        Message.objects.filter(id=message_id, recipient=self.user).update(is_read=True)
