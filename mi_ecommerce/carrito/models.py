from django.db import models
from productos.models import Producto

class Carrito(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    def total(self):
        return self.producto.precio * self.cantidad