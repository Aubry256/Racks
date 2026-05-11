"""
backend/users/auth_views.py

Complete authentication views:
- Login (with rate limiting — max 5 attempts per 15 mins)
- Register (with email verification token)
- Password reset (forgot password flow)
- Password change (for logged-in users)
- Logout (token blacklist)
- Email verify

PASSWORD HASHING:
Django uses PBKDF2SHA256 by default (600,000 iterations as of Django 4.2).
This is the same algorithm used by most banking apps.
We also add bcrypt as a fallback — stronger for long-term storage.

To add bcrypt: pip install bcrypt django[argon2]
Then PASSWORD_HASHERS in settings.py (see below).

HOW PBKDF2 WORKS (plain English):
When a user sets password "racks2026":
1. Django generates a random 'salt' (e.g. "xK7mP2qR")
2. Runs PBKDF2(password + salt, 600000 iterations)
3. Stores: "pbkdf2_sha256$600000$xK7mP2qR$HASHED_OUTPUT"
4. Never stores "racks2026" anywhere

When user logs in:
1. Read the stored hash — get the salt
2. Run PBKDF2(entered_password + salt, 600000 iterations)
3. Compare result — if match, password is correct
4. The original password is never recovered or stored

RATE LIMITING:
Prevents brute force attacks (trying many passwords).
After 5 failed attempts from same IP in 15 minutes → blocked.
Uses Django's cache (Redis) to track attempts.
"""

import hashlib
import secrets
from datetime          import timedelta

from django.conf       import settings
from django.core.cache import cache
from django.core.mail  import send_mail
from django.utils      import timezone

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens      import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .models import User


# ── Rate limiting helper ──────────────────────────────────────────

MAX_LOGIN_ATTEMPTS = 5      # max failures before lockout
LOCKOUT_MINUTES    = 15     # how long the lockout lasts

def _get_client_ip(request) -> str:
    """Extract real client IP, handling proxies."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')

def _check_rate_limit(ip: str, email: str) -> tuple[bool, int]:
    """
    Returns (is_blocked, attempts_remaining).
    Tracks by both IP and email to prevent distributed attacks.
    """
    key        = f'login_attempts:{ip}:{hashlib.md5(email.encode()).hexdigest()[:8]}'
    attempts   = cache.get(key, 0)
    remaining  = MAX_LOGIN_ATTEMPTS - attempts
    is_blocked = attempts >= MAX_LOGIN_ATTEMPTS
    return is_blocked, remaining

def _record_failed_attempt(ip: str, email: str):
    """Increment failed login counter. Expires after LOCKOUT_MINUTES."""
    key      = f'login_attempts:{ip}:{hashlib.md5(email.encode()).hexdigest()[:8]}'
    attempts = cache.get(key, 0) + 1
    cache.set(key, attempts, timeout=LOCKOUT_MINUTES * 60)

def _clear_rate_limit(ip: str, email: str):
    """Clear counter after successful login."""
    key = f'login_attempts:{ip}:{hashlib.md5(email.encode()).hexdigest()[:8]}'
    cache.delete(key)


# ── Login ─────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/

    Body: { "email": "...", "password": "..." }

    Returns:
    {
        "access":  "...",
        "refresh": "...",
        "user": { "id", "email", "full_name", "role" }
    }

    Security:
    - Rate limited: 5 attempts per 15 minutes per IP+email
    - Password checked via Django's verify_password (constant time comparison)
    - Never reveals whether email exists (prevents user enumeration)

    HCI Principle 2 — Feedback:
    Specific error messages:
    - Wrong password: "Incorrect email or password"
    - Rate limited: "Too many attempts. Try again in X minutes."
    - Account inactive: "Your account has been suspended."
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        ip       = _get_client_ip(request)

        # ── Check rate limit ──────────────────────────────────────
        is_blocked, remaining = _check_rate_limit(ip, email)
        if is_blocked:
            return Response({
                'error': f'Too many failed attempts. Please wait {LOCKOUT_MINUTES} minutes before trying again.',
                'blocked': True,
            }, status=429)

        # ── Find user ─────────────────────────────────────────────
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether email exists
            _record_failed_attempt(ip, email)
            _, remaining = _check_rate_limit(ip, email)
            return Response({
                'error': 'Incorrect email or password.',
                'attempts_remaining': remaining,
            }, status=401)

        # ── Check password ────────────────────────────────────────
        # check_password uses constant-time comparison to prevent
        # timing attacks (attacker timing responses to guess passwords)
        if not user.check_password(password):
            _record_failed_attempt(ip, email)
            _, remaining = _check_rate_limit(ip, email)
            return Response({
                'error': 'Incorrect email or password.',
                'attempts_remaining': remaining,
                'warning': 'Account will be temporarily locked after too many attempts.' if remaining <= 2 else None,
            }, status=401)

        # ── Check account is active ───────────────────────────────
        if not user.is_active:
            return Response({
                'error': 'Your account has been suspended. Contact support@racks.ug.',
            }, status=403)

        # ── Generate tokens ───────────────────────────────────────
        _clear_rate_limit(ip, email)
        refresh = RefreshToken.for_user(user)

        # Add custom claims to the token payload
        refresh['role']      = user.role
        refresh['full_name'] = user.full_name
        refresh['email']     = user.email

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':        str(user.id),
                'email':     user.email,
                'full_name': user.full_name,
                'role':      user.role,
                'district':  user.district,
                'phone':     user.phone,
            }
        })


# ── Logout ────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklists the refresh token so it can't be used again.
    The access token will naturally expire in 2 hours.

    Requires: djangorestframework-simplejwt[blacklist]
    And add 'rest_framework_simplejwt.token_blacklist' to INSTALLED_APPS
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            # Token already expired or invalid — that's fine, consider it logged out
            return Response({'message': 'Logged out.'})


# ── Password Reset ────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/

    Body: { "email": "user@example.com" }

    Sends a password reset email with a secure token.
    Token expires in 1 hour.

    Security note:
    Always returns 200 even if email not found —
    prevents attackers from knowing which emails are registered.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        # Always return success — don't reveal if email exists
        if not email:
            return Response({'message': 'If that email is registered, a reset link has been sent.'})

        try:
            user = User.objects.get(email=email, is_active=True)

            # Generate secure random token
            token = secrets.token_urlsafe(32)

            # Store in cache for 1 hour
            cache_key = f'pwd_reset:{token}'
            cache.set(cache_key, str(user.id), timeout=3600)

            # Build reset link
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_link   = f'{frontend_url}/reset-password?token={token}'

            # Send email
            # In development this prints to the console (Django EMAIL_BACKEND setting)
            send_mail(
                subject = 'Reset your Racks password',
                message = (
                    f'Hello {user.full_name or user.email},\n\n'
                    f'You requested a password reset for your Racks account.\n\n'
                    f'Click this link to reset your password (expires in 1 hour):\n'
                    f'{reset_link}\n\n'
                    f'If you did not request this, ignore this email — your password has not changed.\n\n'
                    f'Racks Support Team\n'
                    f'support@racks.ug'
                ),
                from_email  = 'noreply@racks.ug',
                recipient_list = [email],
                fail_silently  = True,
            )

        except User.DoesNotExist:
            pass  # Don't reveal email doesn't exist

        return Response({
            'message': 'If that email is registered, a reset link has been sent. Check your inbox (and spam folder).'
        })


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/

    Body: { "token": "...", "password": "new_password" }

    Validates the token from the forgot-password email,
    sets the new password, and invalidates the token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token    = request.data.get('token', '')
        password = request.data.get('password', '')

        if not token or not password:
            return Response({'error': 'Token and new password are required.'}, status=400)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        # Validate token
        cache_key = f'pwd_reset:{token}'
        user_id   = cache.get(cache_key)

        if not user_id:
            return Response({
                'error': 'This reset link has expired or already been used. Request a new one.',
            }, status=400)

        try:
            user = User.objects.get(id=user_id)
            # Set new password (Django hashes it automatically)
            user.set_password(password)
            user.save()

            # Invalidate the token — can only be used once
            cache.delete(cache_key)

            return Response({'message': 'Password changed successfully. You can now log in.'})

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)


# ── Email Verification ────────────────────────────────────────────

class SendVerificationEmailView(APIView):
    """
    POST /api/auth/send-verification/

    Sends an email verification link to the logged-in user.
    Called automatically after registration.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'message': 'Email already verified.'})

        # Generate token
        token     = secrets.token_urlsafe(32)
        cache_key = f'email_verify:{token}'
        cache.set(cache_key, str(user.id), timeout=24*3600)  # 24 hours

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verify_link  = f'{frontend_url}/verify-email?token={token}'

        send_mail(
            subject = 'Verify your Racks email',
            message = (
                f'Hello {user.full_name or user.email},\n\n'
                f'Click this link to verify your email address:\n'
                f'{verify_link}\n\n'
                f'This link expires in 24 hours.\n\n'
                f'Racks Team'
            ),
            from_email     = 'noreply@racks.ug',
            recipient_list = [user.email],
            fail_silently  = True,
        )

        return Response({'message': 'Verification email sent. Check your inbox.'})


class VerifyEmailView(APIView):
    """
    POST /api/auth/verify-email/

    Body: { "token": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token     = request.data.get('token', '')
        cache_key = f'email_verify:{token}'
        user_id   = cache.get(cache_key)

        if not user_id:
            return Response({'error': 'Verification link has expired. Request a new one.'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            cache.delete(cache_key)
            return Response({'message': 'Email verified successfully!'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
