from django.db import models

class Tile(models.Model):
    tile_id = models.IntegerField(unique=True)
    owner_name = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=7, default='#1a1a2e')
    captured_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tile {self.tile_id} — {self.owner_name}"