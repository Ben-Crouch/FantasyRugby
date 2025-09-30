"""
Django settings for rugby_fantasy project.
"""

from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'fantasy',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'rugby_fantasy.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'rugby_fantasy.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='rugby_fantasy'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    },
    'databricks': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABRICKS_DB_NAME', default='rugby_db'),
        'USER': config('DATABRICKS_USER', default='your-databricks-username'),
        'PASSWORD': config('DATABRICKS_PASSWORD', default='your-databricks-password'),
        'HOST': config('DATABRICKS_HOST', default='your-databricks-host'),
        'PORT': config('DATABRICKS_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# SportsDev API Configuration
SPORTSDEV_API_KEY = config('SPORTSDEV_API_KEY', default='H9bNey5ackumrjwbRHzBSg')
SPORTSDEV_BASE_URL = 'https://api.sportsdev.com/v1'

# Databricks Configuration
DATABRICKS_WORKSPACE_URL = config('DATABRICKS_WORKSPACE_URL', default='https://your-workspace.cloud.databricks.com')
DATABRICKS_ACCESS_TOKEN = config('DATABRICKS_ACCESS_TOKEN', default='your-access-token')
DATABRICKS_CLUSTER_ID = config('DATABRICKS_CLUSTER_ID', default='your-cluster-id')
DATABRICKS_WAREHOUSE_ID = config('DATABRICKS_WAREHOUSE_ID', default='your-warehouse-id')

# Database Router for Databricks (disabled - using REST API instead)
# DATABASE_ROUTERS = ['fantasy.routers.DatabricksRouter']
