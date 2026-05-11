"""
racks_api/settings.py

WHY THIS FILE EXISTS:
Django reads all configuration from here. Database connection,
installed apps, middleware, authentication — all configured here.
We load sensitive values (passwords, API keys) from .env so they
never appear in the code that gets committed to GitHub.
"""

import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Build paths relative to this file's location
BASE_DIR = Path(__file__).resolve().parent.parent

# Load variables from .env file into os.environ
# This must happen before any os.getenv() calls
load_dotenv(BASE_DIR / '.env')

# ── Security ──────────────────────────────────────────────────────
# SECRET_KEY is used for:
# - Signing session cookies
# - Generating CSRF tokens
# - Password reset tokens
# Keep it secret, keep it safe. Change it in production.
SECRET_KEY = os.getenv('SECRET_KEY', 'insecure-dev-key-change-this')

# DEBUG=True shows detailed error pages during development
# MUST be False in production — leaks sensitive info
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Only these hostnames can access Django
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ── Installed Apps ────────────────────────────────────────────────
# Order matters — Django loads them in this order
INSTALLED_APPS = [
    # Django built-ins
    'django.contrib.admin',       # Admin panel at /admin
    'django.contrib.auth',        # User authentication system
    'django.contrib.contenttypes',# Content type framework
    'django.contrib.sessions',    # Session management
    'django.contrib.messages',    # Flash messages
    'django.contrib.staticfiles', # Static file serving

    # Third-party packages
    'rest_framework',             # Django REST Framework (API)
    'corsheaders',                # CORS — allows frontend to call API
    'channels',                   # WebSockets (live order tracking)
    'rest_framework_simplejwt.token_blacklist',  # Logout support

    # Our apps — each handles one area of the platform
    'users',       # User accounts, registration, vendor profiles
    'products',    # Products, categories, inventory
    'orders',      # Shopping cart, orders
    'payments',    # Flutterwave payment integration
    'promotions',  # Flash sales, clearance, brand week
    'delivery',    # Delivery zones per district
]

# ── Middleware ────────────────────────────────────────────────────
# Middleware runs on every request, in order from top to bottom.
# Think of it as a pipeline the request passes through.
MIDDLEWARE = [
    # CORS must be FIRST — before Django does anything else
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'racks_api.urls'

TEMPLATES = [{
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
}]

# ASGI handles both HTTP and WebSocket connections
# WSGI (the default) cannot handle WebSockets at all
# HCI Principle 2 — Feedback: WebSockets enable live order tracking
ASGI_APPLICATION = 'racks_api.asgi.application'
WSGI_APPLICATION = 'racks_api.wsgi.application'

# ── Database ──────────────────────────────────────────────────────
# WHY PostgreSQL over SQLite or MySQL:
# - SQLite: no concurrent writes, no JSONB, not suitable for production
# - MySQL: less powerful JSONB support, worse Django tooling
# - PostgreSQL: ACID compliant, excellent JSONB (we store cart items
#   and product attributes as JSON), best Django support, used by
#   Flutterwave, Jumia, and most serious African e-commerce platforms
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.getenv('DB_NAME',     'racks_db'),
        'USER':     os.getenv('DB_USER',     'racks_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'racks2026'),
        'HOST':     os.getenv('DB_HOST',     'localhost'),
        'PORT':     os.getenv('DB_PORT',     '5432'),
    }
}

# ── Django REST Framework ─────────────────────────────────────────
REST_FRAMEWORK = {
    # All API endpoints require a valid JWT token to access
    # unless explicitly marked as public
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # Read operations (GET) are public, write operations require auth
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    # Return 20 items per page by default
    # HCI Principle 7 — Simplicity: don't overwhelm with too many items
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 200,
}

# JWT token lifetimes
# Access token expires in 2 hours — short for security
# Refresh token expires in 7 days — user stays logged in
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ── CORS ──────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) allows the frontend
# running on localhost:3000 to make API calls to localhost:8000
# Without this, browsers block the requests for security
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ORIGINS', 'http://localhost:3000'
).split(',')

# In development, allow all origins for convenience
CORS_ALLOW_ALL_ORIGINS = DEBUG

# ── Redis + Channels ──────────────────────────────────────────────
# WHY REDIS:
# Redis is an in-memory data store. We use it for:
# 1. Celery task queue: background jobs (send notifications, activate promos)
# 2. Django Channels: WebSocket message routing between server instances
# 3. Caching: store delivery zone and promo price data for 60 seconds
#    so we don't hit the database on every request
#
# HCI Principle 2 — Feedback: Redis enables real-time order status
# to be pushed to the user's browser via WebSockets

REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')

# LOCAL PRESENTATION MODE - no Redis needed
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ── Celery — Background Tasks ─────────────────────────────────────
# WHY CELERY:
# Some tasks should not block the user's request:
# - Sending a notification email (slow)
# - Activating a scheduled promotion (should happen automatically)
# - Processing a webhook from Flutterwave (should be instant response)
# Celery runs these in the background while Django keeps responding
CELERY_BROKER_URL     = f'redis://{REDIS_HOST}:6379/0'
CELERY_RESULT_BACKEND = CELERY_BROKER_URL

# Scheduled tasks — run automatically
CELERY_BEAT_SCHEDULE = {
    # Every 60 seconds: check if any scheduled promotions should go live
    # HCI Principle 3 — Visibility: flash sale timer stays accurate
    'activate-promos': {
        'task':     'promotions.tasks.check_and_activate_promotions',
        'schedule': 60.0,
    },
    # Every 60 seconds: check if any live promotions have expired
    'end-promos': {
        'task':     'promotions.tasks.check_and_end_promotions',
        'schedule': 60.0,
    },
}

# ── Payment Gateway ───────────────────────────────────────────────
# WHY FLUTTERWAVE over PESAPAL:
# - We tested Pesapal on Dombelo and got a 500 crash mid-payment
# - Flutterwave has better error responses (specific failure codes)
# - Flutterwave Uganda supports MTN MoMo + Airtel + Cards
# - Better test mode — realistic sandbox without real money
# - Larger engineering team, more reliable infrastructure
FLUTTERWAVE_SECRET  = os.getenv('FLW_SECRET_KEY', '')
FLUTTERWAVE_WEBHOOK = os.getenv('FLW_WEBHOOK_SECRET', '')
FRONTEND_URL        = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# ── Auth ──────────────────────────────────────────────────────────
# Tell Django to use our custom User model instead of the default one
# Our User has email login (not username) and a role field
AUTH_USER_MODEL = 'users.User'

# ── Static & Media Files ──────────────────────────────────────────
STATIC_URL   = '/static/'
STATIC_ROOT  = BASE_DIR / 'staticfiles'
MEDIA_URL    = '/media/'
MEDIA_ROOT   = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Uganda is UTC+3
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Africa/Kampala'
USE_I18N      = True
USE_TZ        = True


# ── Password Hashing ──────────────────────────────────────────────
# Explicitly declare password hashers.
# PBKDF2SHA256 is Django's default and is strong.
# We list bcrypt as fallback — imported passwords from other systems
# will be transparently upgraded to PBKDF2 on next login.
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Password complexity rules
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
]

# ── Email (console backend for development) ───────────────────────
# Emails print to the terminal in development.
# Change to smtp.EmailBackend for production with real SMTP credentials.
EMAIL_BACKEND  = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = 'noreply@racks.ug'

# ── Login Rate Limiting ───────────────────────────────────────────
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINS = 15
