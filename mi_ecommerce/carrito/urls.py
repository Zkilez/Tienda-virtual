from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    agregar_al_carrito,
    CheckoutView,
    api_agregar_al_carrito,
    api_ver_carrito,
    api_eliminar_del_carrito,
    api_vaciar_carrito,
    api_actualizar_cantidad
)

urlpatterns = [
    # Rutas API
    path('api/ver/', csrf_exempt(api_ver_carrito), name='api_ver_carrito'),
    path('api/agregar/', csrf_exempt(api_agregar_al_carrito), name='api_agregar_al_carrito'),
    
    # Mejora: Añade parámetro product_id a eliminar y actualizar
    path('api/eliminar/<int:producto_id>/', csrf_exempt(api_eliminar_del_carrito), name='api_eliminar_del_carrito'),
    path('api/actualizar/<int:producto_id>/', csrf_exempt(api_actualizar_cantidad), name='api_actualizar_cantidad'),
    
    path('api/vaciar/', csrf_exempt(api_vaciar_carrito), name='api_vaciar_carrito'),
    
    # Si necesitas la vista normal (no API)
    path('', agregar_al_carrito, name='carrito'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
]