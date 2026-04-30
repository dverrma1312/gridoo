from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/grid/', consumers.GridConsumer.as_asgi()),
]