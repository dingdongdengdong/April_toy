import re
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Post, Hashtag, PostHashtag


@receiver(post_save, sender=Post)
def extract_hashtags(sender, instance, created, **kwargs):
    if created and instance.caption:
        tags = set(re.findall(r'#(\w+)', instance.caption.lower()))
        for tag in tags:
            hashtag, _ = Hashtag.objects.get_or_create(name=tag)
            hashtag.usage_count = Hashtag.objects.filter(name=tag).count()
            PostHashtag.objects.get_or_create(post=instance, hashtag=hashtag)
            hashtag.usage_count = PostHashtag.objects.filter(hashtag=hashtag).count()
            hashtag.save()
