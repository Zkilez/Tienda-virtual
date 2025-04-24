from django.urls import path
from .views import RegistroUsuarioView, LoginUsuarioView, LogoutUsuarioView

urlpatterns = [
    path('registro/', RegistroUsuarioView.as_view(), name='registro'),
    path('login/', LoginUsuarioView.as_view(), name='login'),
    path('logout/', LogoutUsuarioView.as_view(), name='logout'),
]
 