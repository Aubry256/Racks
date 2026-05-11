"""
products/models.py

Two models: Category and Product.

WHY JSONB FOR attributes AND images:
Product specifications vary wildly by category:
- A TV has: screen size, resolution, smart OS, HDMI ports
- A Blender has: power (watts), capacity (litres), blades
- A Phone has: RAM, storage, camera megapixels, battery

Instead of creating a separate column for each possible attribute
(which would leave most columns empty for most products),
we store attributes as a flexible JSON object.
PostgreSQL's JSONB type makes these searchable and indexable.

HCI Principle 3 — Visibility:
We store promo_price and on_promo directly on the product
so the API can return current price without extra queries.
Stock levels are always visible to users.
"""

import uuid
from django.db import models


class Category(models.Model):
    """
    Product categories — forms the navigation structure.

    Examples: Electronics, Kitchen, Fashion, Home & Living
    Sub-categories: Electronics > Phones, Electronics > Laptops

    The 'parent' field creates the hierarchy.
    """

    name   = models.CharField(max_length=100)
    slug   = models.SlugField(
        unique=True,
        help_text='URL-safe name: "home-living" not "Home & Living"'
    )
    # Self-referential: a category can have a parent category
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
        help_text='Parent category, if this is a sub-category'
    )
    icon      = models.CharField(max_length=10, blank=True, help_text='Emoji icon: 📱 🍳 ❄️')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering            = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    A product listed on Racks.

    UUID primary key for same reason as User:
    - Safe to expose in URLs
    - Doesn't reveal how many products exist
    - Hard to enumerate (scraping protection)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Which vendor sells this product
    # SET_NULL: if a vendor account is deleted, keep the product
    vendor = models.ForeignKey(
        'users.VendorProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
    )

    # Basic product information
    name        = models.CharField(max_length=255)
    slug        = models.SlugField(unique=True, help_text='URL: /product/samsung-43-qled-tv')
    description = models.TextField(blank=True)
    brand       = models.CharField(max_length=100, blank=True)

    # Pricing
    # price = original/normal price
    # promo_price = discounted price (set by promotions system)
    # current_price() method returns whichever applies right now
    price      = models.DecimalField(max_digits=12, decimal_places=2)
    promo_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Set automatically when a promotion activates'
    )
    on_promo = models.BooleanField(
        default=False,
        help_text='True when an active promotion is applying a discount'
        # HCI Principle 3 — Visibility: price transparency
    )

    # ── Inventory ──────────────────────────────────────────────
    # HCI Principle 3 — Visibility:
    # Always show stock levels so users know what's available.
    # Dombelo showed no stock info — users didn't know if items
    # were available before trying to buy.
    stock_qty = models.IntegerField(
        default=0,
        help_text='Current stock. 0 = out of stock.'
    )

    # ── Flexible attributes as JSON ───────────────────────────
    # e.g. {"screen": "43 inches", "resolution": "4K", "os": "Tizen"}
    # Different products have completely different spec sets
    attributes = models.JSONField(
        default=dict,
        help_text='Product specifications as key-value pairs'
    )

    # Product images — list of URLs
    # e.g. ["/media/products/tv-front.jpg", "/media/products/tv-side.jpg"]
    images = models.JSONField(default=list)

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            # Speed up common filter queries
            models.Index(fields=['category']),
            models.Index(fields=['brand']),
            models.Index(fields=['on_promo']),    # homepage flash sale filter
            models.Index(fields=['is_active', 'stock_qty']),
        ]

    def current_price(self):
        """
        Returns the price a customer should pay right now.

        If a promotion is active and a promo_price is set,
        return the discounted price. Otherwise return normal price.

        HCI Principle 3 — Visibility:
        The frontend always calls this method — users always see
        the correct current price without doing any calculation.
        """
        if self.on_promo and self.promo_price:
            return self.promo_price
        return self.price

    def __str__(self):
        return f'{self.brand} {self.name} (Stock: {self.stock_qty})'
