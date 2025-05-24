from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from django.http import JsonResponse
from mi_ecommerce.admin_site import admin_site
from productos.views import inicio
from django.views.decorators.http import require_GET

@require_GET
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

urlpatterns = [
    path('', inicio, name='inicio'),
    path('admin/', admin_site.urls),
    path('api/', include([
        path('users/', include('usuarios.urls')),
        path('csrf/', get_csrf_token, name='csrf_token'),  # Ahora bajo /api/
    ])),
    path('productos/', include('productos.urls')),
    path('chatbot/', include('chatbot.urls')),
]