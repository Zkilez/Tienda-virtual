from django.urls import path
from .views import agregar_al_carrito

urlpatterns = [
    path('agregar/<int:producto_id>/', agregar_al_carrito, name='agregar_al_carrito'),
]