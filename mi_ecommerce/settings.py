import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

OPENROUTER_API_KEY = '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'
SITE_URL = 'http://localhost:8000'
APP_NAME = 'Chatbot Celulares'

SECRET_KEY = 'django-insecure-goh$gxpu36(*pj9ye-zzc(tivk5%mzd__v4p98!61$x#xq92&8'
DEBUG = True
ALLOWED_HOSTS = ['*']  # Modificado para permitir todos los hosts en desarrollo

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'productos',
    'carrito',
    'usuarios',  # Asegúrate que esta app contiene el modelo Usuario personalizado
    'chatbot',
]

MIDDLEWARE = [
    'mi_ecommerce.middleware.CorsMiddleware',  # Reemplaza django-cors-headers
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# Configuración CSRF para desarrollo
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CSRF_COOKIE_SECURE = False  # True en producción
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SECURE = False  # True en producción
SESSION_COOKIE_SAMESITE = 'Lax'

ROOT_URLCONF = 'mi_ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "mi_ecommerce/templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mi_ecommerce.wsgi.application'

# Configuración de base de datos para MySQL con tu tabla existente
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'CHATCelulares',
        'USER': 'root',
        'PASSWORD': 'Hombrepollo',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        }
    }
}

# Validadores de contraseña
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Configuración de REST Framework con JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

# Configuración de JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT'),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# Internacionalización
LANGUAGE_CODE = 'es-es'  # Cambiado a español
TIME_ZONE = 'America/Mexico_City'  # Ajusta según tu zona horaria
USE_I18N = True
USE_TZ = True

# Archivos estáticos y multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
STATIC_URL = 'static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Modelo de usuario personalizado para trabajar con tu tabla existente
AUTH_USER_MODEL = 'usuarios.Usuario'  # Cambiado de 'usuarios.User' a 'usuarios.Usuario'

# Backends de autenticación
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  # Mantén este primero
    'usuarios.backends.CustomUserBackend',  # Tu backend personalizado si es necesario
]

# URLs de autenticación
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'http://localhost:5173'
LOGOUT_REDIRECT_URL = 'http://localhost:5173'

# Configuración de correo (opcional, para recuperación de contraseña)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Solo para desarrollo
DEFAULT_FROM_EMAIL = 'noreply@chatbotcelulares.com'