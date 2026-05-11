"""
backend/admin_register.py

Registers all Racks models with the Django admin panel.
This makes everything manageable at http://localhost:8000/admin

Copy the @admin.register decorators from here into each app's admin.py,
OR Django's auto-discovery will use the ones in each app's admin.py file.

This file exists as a single reference showing ALL registrations.
"""

# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from users.models import User, VendorProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ['email', 'full_name', 'role', 'district', 'is_active', 'created_at']
    list_filter    = ['role', 'is_active', 'is_verified']
    search_fields  = ['email', 'full_name', 'phone']
    ordering       = ['-created_at']
    fieldsets      = (
        (None,           {'fields': ('email', 'password')}),
        ('Profile',      {'fields': ('full_name', 'phone', 'district', 'role')}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified')}),
    )
    add_fieldsets  = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2', 'role')}),
    )

@admin.register(VendorProfile)
class VendorAdmin(admin.ModelAdmin):
    list_display  = ['store_name', 'user', 'plan', 'status', 'district', 'created_at']
    list_filter   = ['status', 'plan']
    search_fields = ['store_name', 'user__email']
    ordering      = ['-created_at']


# products/admin.py
from products.models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'icon', 'parent', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['name', 'slug']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ['name', 'brand', 'category', 'price', 'promo_price', 'on_promo', 'stock_qty', 'is_active']
    list_filter   = ['on_promo', 'is_active', 'category', 'brand']
    search_fields = ['name', 'brand', 'slug']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


# orders/admin.py
from orders.models import Cart, Order

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'updated_at']
    search_fields = ['user__email']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display   = ['id', 'user', 'status', 'payment_status', 'total_amount', 'district', 'draft', 'created_at']
    list_filter    = ['status', 'payment_status', 'draft']
    search_fields  = ['user__email', 'payment_ref']
    ordering       = ['-created_at']
    readonly_fields= ['created_at', 'updated_at']
    # Admin can update order status to trigger WebSocket notifications
    # e.g. change status to 'dispatched' → user gets live notification


# payments/admin.py
from payments.views import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['provider_ref', 'order', 'amount', 'status', 'provider', 'created_at']
    list_filter   = ['status', 'provider']
    search_fields = ['provider_ref', 'order__id']
    ordering      = ['-created_at']
    readonly_fields = ['payload', 'created_at']


# promotions/admin.py
from promotions.views import Promotion

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display  = ['name', 'promo_type', 'status', 'discount_pct', 'applies_to', 'starts_at', 'ends_at', 'orders_count']
    list_filter   = ['status', 'promo_type', 'applies_to']
    search_fields = ['name']
    ordering      = ['-created_at']
    actions       = ['activate_selected', 'pause_selected']

    def activate_selected(self, request, queryset):
        from promotions.views import _apply_promo_prices
        from django.utils import timezone
        for p in queryset:
            p.status = 'live'
            p.starts_at = timezone.now()
            p.save()
            _apply_promo_prices(p)
        self.message_user(request, f'{queryset.count()} promotion(s) activated.')
    activate_selected.short_description = 'Activate selected promotions'

    def pause_selected(self, request, queryset):
        from promotions.views import _clear_promo_prices
        for p in queryset:
            p.status = 'paused'
            p.save()
            _clear_promo_prices(p)
        self.message_user(request, f'{queryset.count()} promotion(s) paused.')
    pause_selected.short_description = 'Pause selected promotions'


# delivery/admin.py
from delivery.models import DeliveryZone

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display  = ['district', 'is_covered', 'delivery_days', 'delivery_fee', 'free_above']
    list_filter   = ['is_covered']
    search_fields = ['district']
    ordering      = ['district']
