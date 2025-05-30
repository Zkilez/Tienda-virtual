from django.urls import path
from .views import RegisterView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),  # Ruta final: /api/users/register/
    path('login/', LoginView.as_view(), name='login'),
]