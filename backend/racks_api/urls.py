"""
racks_api/urls.py

This is the main URL router for the entire API.
Every API endpoint in Racks is registered here.

URL patterns explained:
- /api/auth/    → login, register, token refresh
- /api/products/ → browse products, get delivery info
- /api/orders/  → create orders, view order history
- /api/payments/ → initiate payment, receive webhook
- /api/promotions/ → active sales, flash deals
- /api/delivery-zones/ → districts we deliver to
- /admin/       → Django admin panel (manage everything)
"""

from django.contrib import admin
from django.urls    import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # POST email+password → returns access+refresh tokens
    TokenRefreshView,     # POST refresh token → returns new access token
)

urlpatterns = [
    # Admin panel — manage products, orders, users through a GUI
    # Visit: http://localhost:8000/admin
    path('admin/', admin.site.urls),

    # ── Authentication endpoints ──────────────────────────────
    # POST /api/auth/token/ — login
    # Body: {"email": "user@example.com", "password": "..."}
    # Returns: {"access": "...", "refresh": "..."}
    path('api/auth/token/',   TokenObtainPairView.as_view(), name='token_obtain'),

    # POST /api/auth/refresh/ — get new access token when it expires
    # Body: {"refresh": "..."}
    # Returns: {"access": "..."}
    path('api/auth/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),

    # POST /api/auth/register/ — create new user account
    path('api/auth/',         include('users.urls')),

    # ── Product endpoints ─────────────────────────────────────
    # GET  /api/products/             — list all products
    # GET  /api/products/?category=electronics — filter by category
    # GET  /api/products/{id}/        — single product detail
    # GET  /api/products/{id}/delivery/?district=Kampala — delivery info
    # GET  /api/categories/           — list all categories
    path('api/products/',     include('products.urls')),

    # ── Order endpoints ───────────────────────────────────────
    # POST /api/orders/          — create draft order (HCI P.4)
    # GET  /api/orders/          — my order history
    # GET  /api/orders/{id}/     — single order detail
    # GET  /api/cart/            — get my cart
    # PUT  /api/cart/update/     — update cart items
    path('api/orders/',       include('orders.urls')),

    # ── Payment endpoints ─────────────────────────────────────
    # POST /api/payments/initiate/ — start MoMo payment via Flutterwave
    # POST /api/payments/webhook/  — Flutterwave calls this when payment succeeds
    path('api/payments/',     include('payments.urls')),

    # ── Promotion endpoints ───────────────────────────────────
    # GET /api/promotions/active/ — all live promotions (for homepage)
    # GET /api/promotions/        — all promotions (admin only)
    path('api/promotions/',   include('promotions.urls')),

    # ── Delivery zone endpoints ───────────────────────────────
    # GET /api/delivery-zones/ — all districts
    # GET /api/delivery-zones/?covered=true — only covered districts
    path('api/delivery-zones/', include('delivery.urls')),
]
