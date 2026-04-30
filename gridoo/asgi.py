import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gridoo.settings')

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()  # this must run before any app imports

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import grid.routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(grid.routing.websocket_urlpatterns)
    ),
})