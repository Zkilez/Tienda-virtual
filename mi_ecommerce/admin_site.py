from django.contrib.admin import AdminSite
from django.contrib import admin

class CustomAdminSite(AdminSite):
    site_header = "Administración de Mi Tienda"
    site_title = "Panel de Administración"
    index_title = "Gestión de Productos y Pedidos"

admin_site = CustomAdminSite(name='custom_admin')

# Registrar los modelos aquí (Ejemplo)
from productos.models import Producto  # Asegúrate de importar correctamente tu modelo
admin_site.register(Producto)