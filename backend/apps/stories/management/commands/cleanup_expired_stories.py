from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.stories.models import Story


class Command(BaseCommand):
    help = 'Delete stories that have expired (older than 24h)'

    def handle(self, *args, **options):
        now = timezone.now()
        expired = Story.objects.filter(expires_at__lte=now)
        count = expired.count()
        expired.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} expired stories.'))
