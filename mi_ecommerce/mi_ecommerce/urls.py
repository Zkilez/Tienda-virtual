from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from mi_ecommerce.admin_site import admin_site
from productos.views import inicio  # Importa la vista de inicio
from mi_ecommerce.views import inicio 
urlpatterns = [
    path('', inicio, name='inicio'),  # Nueva ruta para la página principal
    path('admin/', admin_site.urls),
    path('productos/', include('productos.urls')),
    path('usuarios/', include('usuarios.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)