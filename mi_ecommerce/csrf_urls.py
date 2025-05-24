# backend/mi_ecommerce/csrf_urls.py
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie configurada"})

urlpatterns = [
    path('', get_csrf_token, name='csrf_token'),
]