from django.contrib import admin
from django.core.cache import cache
from .views import Promotion, _apply_promo_prices, _clear_promo_prices

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('name','promo_type','status','discount_pct','applies_to','starts_at','ends_at','orders_count')
    list_filter = ('status','promo_type','applies_to')
    search_fields = ('name',)
    readonly_fields = ('id','orders_count','created_at','created_by')
    ordering = ('-created_at',)
    actions = ['activate_promos','pause_promos','end_promos']

    def save_model(self, request, obj, form, change):
        if not change: obj.created_by = request.user
        super().save_model(request, obj, form, change)
        cache.delete('promotions:active')

    @admin.action(description='Activate selected promotions')
    def activate_promos(self, request, queryset):
        for p in queryset:
            p.status = 'live'; p.save(); _apply_promo_prices(p); cache.delete('promotions:active')
        self.message_user(request, f'{queryset.count()} activated.')

    @admin.action(description='Pause selected promotions')
    def pause_promos(self, request, queryset):
        for p in queryset:
            p.status = 'paused'; p.save(); _clear_promo_prices(p); cache.delete('promotions:active')
        self.message_user(request, f'{queryset.count()} paused.')

    @admin.action(description='End selected promotions')
    def end_promos(self, request, queryset):
        for p in queryset:
            p.status = 'ended'; p.save(); _clear_promo_prices(p); cache.delete('promotions:active')
        self.message_user(request, f'{queryset.count()} ended.')
