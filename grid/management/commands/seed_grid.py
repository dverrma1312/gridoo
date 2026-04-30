from django.core.management.base import BaseCommand
from grid.models import Tile

class Command(BaseCommand):
    help = 'Seeds the grid with 800 empty tiles'

    def handle(self, *args, **kwargs):
        tiles = [Tile(tile_id=i, color='#1a1a2e') for i in range(800)]
        Tile.objects.bulk_create(tiles, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS('Grid seeded — 800 tiles ready'))