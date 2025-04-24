from django.contrib import admin
from django.urls import path
from chatbot import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', views.chat, name='chat'),  # Usa views.chat en lugar de views.api_chat
    path('', views.chat, name='chatbot_main'),   # Esto también apunta a chat
]

