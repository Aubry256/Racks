from django.contrib import admin
from .models import DeliveryZone

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ('district','is_covered','delivery_days','delivery_fee','free_above','notes')
    list_filter = ('is_covered',)
    search_fields = ('district',)
    list_editable = ('is_covered','delivery_days','delivery_fee')
    ordering = ('district',)
