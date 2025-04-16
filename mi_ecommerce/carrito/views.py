from django.shortcuts import redirect
from .models import Carrito
from productos.models import Producto

def agregar_al_carrito(request, producto_id):
    producto = Producto.objects.get(id=producto_id)
    carrito_item, created = Carrito.objects.get_or_create(producto=producto)
    carrito_item.cantidad += 1
    carrito_item.save()
    return redirect('lista_productos')