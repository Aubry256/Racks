from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name','slug','icon','parent','is_active')
    list_filter = ('is_active',)
    search_fields = ('name','slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name','brand','category','price','promo_price','on_promo','stock_qty','is_active','created_at')
    list_filter = ('category','brand','on_promo','is_active')
    search_fields = ('name','brand','slug')
    list_editable = ('price','stock_qty','is_active')
    readonly_fields = ('created_at','updated_at')
    prepopulated_fields = {'slug': ('name',)}
