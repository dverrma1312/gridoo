from django.shortcuts import render
from .models import Tile
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import TileSerializer
from django.db.models import Count

class grid(APIView):
    def get(self, request):
        tiles = Tile.objects.all().order_by('tile_id')
        serializer = TileSerializer(tiles, many=True)
        return Response(serializer.data)

# Create your views here.
class leaderboard(APIView):
    def get(self, request):
        data = (
            Tile.objects
            .exclude(owner_name=None)
            .values('owner_name', 'color')
            .annotate(count=Count('tile_id'))
            .order_by('-count')[:10]
        )
        return Response(list(data))

