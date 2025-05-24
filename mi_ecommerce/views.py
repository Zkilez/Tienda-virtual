from django.shortcuts import render

def inicio(request):
    return render(request, 'mi_ecommerce/inicio.html')  # Ruta correcta