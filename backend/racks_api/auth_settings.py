"""
racks_api/settings.py — ADDITIONS to existing settings.py

Add these blocks to the bottom of your existing settings.py file.
They add:
1. Explicit password hashing algorithm (PBKDF2 + bcrypt fallback)
2. Email configuration (prints to console in development)
3. Token blacklist app (for logout)
4. Login rate limit settings
"""

# ── Password Hashing ──────────────────────────────────────────────
# WHY EXPLICIT:
# Django defaults to PBKDF2SHA256 which is good, but by declaring
# it explicitly we:
# 1. Document our security choice clearly
# 2. Control the iteration count
# 3. Add bcrypt as a fallback for passwords hashed by other systems
#
# HOW IT WORKS:
# Django tries hashers in order. Existing passwords are
# automatically upgraded to the first hasher on next login.
#
# PBKDF2SHA256 with 720,000 iterations (Django 5.x default):
# Takes ~0.1 seconds per hash — fast enough for users,
# too slow for attackers trying millions of passwords.
PASSWORD_HASHERS = [
    # Primary hasher — used for all new passwords
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    # Fallback hashers — only used to verify old passwords
    # and automatically upgrade them on next login
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Password validation rules
AUTH_PASSWORD_VALIDATORS = [
    # Must be at least 8 characters
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    # Can't be entirely numeric (e.g. "12345678")
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    # Can't be too similar to email or name
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
]

# ── Email Configuration ───────────────────────────────────────────
# In development: emails are printed to the console (no real email sent)
# In production: change EMAIL_BACKEND to django.core.mail.backends.smtp.EmailBackend
# and set EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD

import os
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend'  # prints to terminal in dev
)
# For production (e.g. Gmail):
# EMAIL_BACKEND   = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST      = 'smtp.gmail.com'
# EMAIL_PORT      = 587
# EMAIL_USE_TLS   = True
# EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = 'noreply@racks.ug'

# ── Token Blacklist (for logout) ──────────────────────────────────
# Add this to INSTALLED_APPS in settings.py:
# 'rest_framework_simplejwt.token_blacklist',
#
# Then run: python manage.py migrate
# This creates a table of blacklisted tokens so logged-out
# users can't reuse their old tokens.

# ── Rate Limiting ─────────────────────────────────────────────────
# These are read by auth_views.py
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINS = 15
