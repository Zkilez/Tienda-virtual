from django.shortcuts import render
from .models import Producto

def lista_productos(request):
    productos = Producto.objects.all()
    return render(request, 'productos/lista.html', {'productos': productos})

def inicio(request):  # Ahora está correctamente indentado
    return render(request, 'inicio.html')  # Cambia la ruta si 'inicio.html' está en mi_ecommerce/templates/
