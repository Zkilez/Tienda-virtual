from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.models import User
from django.views.generic.edit import CreateView
from django.urls import reverse_lazy
from django.shortcuts import redirect
from django.contrib import messages
from django import forms


# Formulario personalizado para el registro
class RegistroForm(forms.ModelForm):
    password1 = forms.CharField(label='Contraseña', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirmar Contraseña', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email']

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get("password1") != cleaned_data.get("password2"):
            raise forms.ValidationError("Las contraseñas no coinciden.")
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


# Vista de registro usando POO
class RegistroUsuarioView(CreateView):
    model = User
    form_class = RegistroForm
    template_name = 'usuarios/registro.html'
    success_url = reverse_lazy('login')


# Vista de login
class LoginUsuarioView(LoginView):
    template_name = 'usuarios/login.html'


# Vista de logout
class LogoutUsuarioView(LogoutView):
    next_page = reverse_lazy('login')