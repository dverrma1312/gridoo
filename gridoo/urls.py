from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from grid.views import grid, leaderboard
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/grid/', grid.as_view()),
    path('api/leaderboard/', leaderboard.as_view()),
    path('', TemplateView.as_view(template_name='index.html')),
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])