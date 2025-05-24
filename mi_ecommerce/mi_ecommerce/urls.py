from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET  # Importación faltante
from productos.views import inicio
from usuarios.views import RegisterView  # Importación faltante
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Vista para CSRF
@require_GET
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie configurada"})

urlpatterns = [
    path('', inicio, name='inicio'),
    path('admin/', admin.site.urls),
    path('productos/', include('productos.urls')),
    path('api/users/', include('usuarios.urls')),
    path('chatbot/', include('chatbot.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/csrf/', get_csrf, name='csrf_token'),
    path('api/users/register/', RegisterView.as_view(), name='register'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)