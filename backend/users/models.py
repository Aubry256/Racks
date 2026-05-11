"""
users/models.py

WHY A CUSTOM USER MODEL:
Django's default User model uses a username for login.
We want email-based login (more modern, what users expect).
We also need a 'role' field to distinguish customers from vendors.
Django recommends defining a custom user model from the start —
changing it later is very difficult.

HCI Principle 1 — Consistency:
The same User model is used across web and mobile.
A user logging into the web and mobile app sees
the same account, same order history, same profile.
"""

import uuid
from django.db                  import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    """
    Custom manager tells Django how to create users.
    We override create_user to require email (not username).
    """

    def create_user(self, email, password=None, **extra_fields):
        """Create a regular customer account."""
        if not email:
            raise ValueError('Email address is required')

        # Normalize: convert 'User@Example.COM' → 'user@example.com'
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        # Hash the password — never store plaintext passwords
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create an admin account (for the Django admin panel)."""
        extra_fields.setdefault('is_staff',     True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Racks.

    Uses UUID as primary key instead of integer:
    - UUIDs are globally unique — safe to expose in URLs
    - Integers are sequential — exposes how many users you have
    - UUIDs make it harder to enumerate users (security)
    """

    # Role choices — determines what a user can do
    ROLE_CHOICES = [
        ('customer', 'Customer'),  # Can shop and place orders
        ('vendor',   'Vendor'),    # Can list products and manage inventory
        ('admin',    'Admin'),     # Full platform access
    ]

    # UUID primary key — more secure than sequential integers
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Unique identifier — never changes'
    )

    # Email as username — modern, what users expect
    email = models.EmailField(
        unique=True,
        help_text='Used for login and order notifications'
    )

    # Profile fields
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Uganda mobile number — used for MoMo payouts'
    )
    full_name  = models.CharField(max_length=255, blank=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    district   = models.CharField(
        max_length=100,
        blank=True,
        help_text='Saved district — pre-fills checkout delivery field'
        # HCI Principle 6 — Learnability: remembering the user's
        # district reduces friction on their next order
    )

    # Account status flags
    is_verified = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)  # Can access admin panel

    created_at = models.DateTimeField(auto_now_add=True)

    # Tell Django: use 'email' as the login field instead of 'username'
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []  # Only email+password required at creation

    objects = UserManager()

    class Meta:
        verbose_name        = 'User'
        verbose_name_plural = 'Users'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.email} ({self.role})'


class VendorProfile(models.Model):
    """
    Extra information for vendor accounts.
    Linked 1-to-1 with a User who has role='vendor'.

    WHY SEPARATE TABLE:
    Most users are customers — they don't need vendor fields.
    Separating vendor data keeps the User table lean and fast.
    """

    PLAN_CHOICES = [
        ('starter', 'Starter — Free, 8% commission'),
        ('pro',     'Pro — UGX 80,000/mo, 5% commission'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending Review'),  # Just applied
        ('active',    'Active'),          # Approved and selling
        ('suspended', 'Suspended'),       # Banned or unpaid
    ]

    user         = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='vendor_profile',
        help_text='The user account this vendor profile belongs to'
    )
    store_name   = models.CharField(max_length=200)
    store_slug   = models.SlugField(unique=True, help_text='URL-safe store name e.g. techeast-uganda')
    description  = models.TextField(blank=True)
    logo_url     = models.URLField(blank=True)
    district     = models.CharField(max_length=100)
    business_type= models.CharField(max_length=50, blank=True)
    tin_number   = models.CharField(max_length=50, blank=True)
    plan         = models.CharField(max_length=20, choices=PLAN_CHOICES, default='starter')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payout_phone = models.CharField(max_length=20, help_text='MTN or Airtel number for payouts')
    commission_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=8.00,
        help_text='Percentage Racks keeps from each sale'
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.store_name} ({self.status})'
