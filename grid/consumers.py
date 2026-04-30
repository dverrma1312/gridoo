import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Tile


class GridConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.channel_layer.group_add('grid', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('grid', self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        tile_id = data['tile_id']
        owner_name = data['owner_name']
        color = data['color']

        await self.save_tile(tile_id, owner_name, color)

        await self.channel_layer.group_send('grid', {
            'type': 'tile.updated',
            'tile_id': tile_id,
            'owner_name': owner_name,
            'color': color,
        })

    async def tile_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tile.updated',
            'tile_id': event['tile_id'],
            'owner_name': event['owner_name'],
            'color': event['color'],
        }))

    async def online_count(self, event):
        await self.send(text_data=json.dumps({
            'type': 'online.count',
            'count': event['count'],
        }))

    @database_sync_to_async
    def save_tile(self, tile_id, owner_name, color):
        Tile.objects.filter(tile_id=tile_id).update(
            owner_name=owner_name,
            color=color
        )