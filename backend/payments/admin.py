from django.contrib import admin
from .views import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('short_id','short_order','provider','amount','currency','status','provider_ref','created_at')
    list_filter = ('status','provider')
    search_fields = ('provider_ref','order__id')
    readonly_fields = ('id','payload','created_at')
    ordering = ('-created_at',)

    @admin.display(description='Payment ID')
    def short_id(self, obj): return str(obj.id)[:8].upper()

    @admin.display(description='Order')
    def short_order(self, obj): return str(obj.order.id)[:8].upper()
