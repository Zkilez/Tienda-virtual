from django.shortcuts import redirect, render
from .models import Carrito
from productos.models import Producto
from django.conf import settings
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import json
import stripe
import logging
from django.db import transaction

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

def add_cors_headers(response):
    """Añade headers CORS a la respuesta"""
    response["Access-Control-Allow-Origin"] = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

def handle_options_request():
    """Maneja las peticiones OPTIONS (preflight)"""
    response = JsonResponse({}, status=200)
    return add_cors_headers(response)

@method_decorator(csrf_exempt, name='dispatch')
class CarritoAPI(View):
    """Vista basada en clase para manejar todas las operaciones del carrito"""
    
    def options(self, request, *args, **kwargs):
        return handle_options_request()
    
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """Obtener el contenido del carrito"""
        try:
            with transaction.atomic():
                carrito_items = Carrito.objects.filter(
                    usuario=request.user
                ).select_related('producto')
                
                items = [{
                    'id': item.id,
                    'producto': {
                        'id': item.producto.id,
                        'nombre': item.producto.nombre,
                        'precio': float(item.producto.precio),
                        'stock': item.producto.stock,
                        'imagen': item.producto.imagen.url if item.producto.imagen else None
                    },
                    'cantidad': item.cantidad,
                    'subtotal': float(item.producto.precio * item.cantidad)
                } for item in carrito_items]
                
                response_data = {
                    'carrito': items,
                    'total_items': sum(item.cantidad for item in carrito_items),
                    'total_precio': sum(item.producto.precio * item.cantidad for item in carrito_items)
                }
                
                response = JsonResponse(response_data)
                return add_cors_headers(response)
                
        except Exception as e:
            logger.error(f"Error al obtener carrito: {str(e)}")
            response = JsonResponse(
                {'error': 'Error al cargar el carrito'}, 
                status=500
            )
            return add_cors_headers(response)
    
    def post(self, request):
        """Agregar o actualizar producto en el carrito"""
        try:
            data = json.loads(request.body)
            producto_id = data.get('producto_id')
            cantidad = data.get('cantidad', 1)
            
            if not producto_id:
                return JsonResponse(
                    {'error': 'producto_id es requerido'}, 
                    status=400
                )
            
            with transaction.atomic():
                producto = Producto.objects.select_for_update().get(id=producto_id)
                
                if producto.stock < cantidad:
                    return JsonResponse(
                        {'error': 'No hay suficiente stock'},
                        status=400
                    )
                
                carrito_item, created = Carrito.objects.get_or_create(
                    producto=producto,
                    usuario=request.user,
                    defaults={'cantidad': cantidad}
                )
                
                if not created:
                    carrito_item.cantidad += cantidad
                    carrito_item.save()
                
                response_data = {
                    'status': 'success',
                    'carrito_item': {
                        'id': carrito_item.id,
                        'producto_id': producto.id,
                        'cantidad': carrito_item.cantidad
                    },
                    'stock_actual': producto.stock - carrito_item.cantidad
                }
                
                response = JsonResponse(response_data)
                return add_cors_headers(response)
                
        except Producto.DoesNotExist:
            return JsonResponse(
                {'error': 'Producto no encontrado'}, 
                status=404
            )
        except Exception as e:
            logger.error(f"Error en carrito: {str(e)}")
            return JsonResponse(
                {'error': 'Error interno del servidor'}, 
                status=500
            )
    
    def delete(self, request):
        """Eliminar producto del carrito"""
        try:
            data = json.loads(request.body)
            producto_id = data.get('producto_id')
            
            if not producto_id:
                return JsonResponse(
                    {'error': 'producto_id es requerido'}, 
                    status=400
                )
            
            with transaction.atomic():
                Carrito.objects.filter(
                    producto_id=producto_id,
                    usuario=request.user
                ).delete()
                
                return JsonResponse(
                    {'status': 'success', 'producto_id': producto_id}
                )
                
        except Exception as e:
            logger.error(f"Error al eliminar del carrito: {str(e)}")
            return JsonResponse(
                {'error': 'Error interno del servidor'}, 
                status=500
            )

@method_decorator(csrf_exempt, name='dispatch')
class VaciarCarritoAPI(View):
    """Vista para vaciar el carrito completamente"""
    
    def options(self, request, *args, **kwargs):
        return handle_options_request()
    
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        try:
            with transaction.atomic():
                Carrito.objects.filter(usuario=request.user).delete()
                return JsonResponse({'status': 'success'})
        except Exception as e:
            logger.error(f"Error al vaciar carrito: {str(e)}")
            return JsonResponse(
                {'error': 'Error interno del servidor'}, 
                status=500
            )

@method_decorator(csrf_exempt, name='dispatch')
class CheckoutAPI(View):
    """Proceso de pago con Stripe"""
    
    def options(self, request, *args, **kwargs):
        return handle_options_request()
    
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        try:
            with transaction.atomic():
                carrito_items = Carrito.objects.filter(
                    usuario=request.user
                ).select_related('producto').select_for_update()
                
                if not carrito_items.exists():
                    return JsonResponse(
                        {'error': 'Carrito vacío'}, 
                        status=400
                    )
                
                line_items = []
                for item in carrito_items:
                    if item.producto.stock < item.cantidad:
                        return JsonResponse(
                            {'error': f'No hay suficiente stock de {item.producto.nombre}'},
                            status=400
                        )
                    
                    line_items.append({
                        'price_data': {
                            'currency': 'usd',
                            'unit_amount': int(item.producto.precio * 100),
                            'product_data': {
                                'name': item.producto.nombre,
                            },
                        },
                        'quantity': item.cantidad,
                    })
                
                checkout_session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=line_items,
                    mode='payment',
                    success_url=f"{settings.SITE_URL}/carrito/success/",
                    cancel_url=f"{settings.SITE_URL}/carrito/cancel/",
                    metadata={'user_id': str(request.user.id)}
                )
                
                # Actualizar stock después de crear la sesión de pago
                for item in carrito_items:
                    item.producto.stock -= item.cantidad
                    item.producto.save()
                
                # Vaciar el carrito después del pago exitoso
                carrito_items.delete()
                
                return JsonResponse({'url': checkout_session.url})
                
        except stripe.error.StripeError as e:
            logger.error(f"Error en Stripe: {str(e)}")
            return JsonResponse(
                {'error': str(e)}, 
                status=400
            )
        except Exception as e:
            logger.error(f"Error en checkout: {str(e)}")
            return JsonResponse(
                {'error': 'Error interno del servidor'}, 
                status=500
            )