from django.contrib import admin
from .models import Order, Cart

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('short_id','user','status','payment_status','district','total_amount','draft','created_at')
    list_filter = ('status','payment_status','draft','district')
    search_fields = ('id','user__email','payment_ref')
    list_editable = ('status',)
    readonly_fields = ('id','created_at','updated_at')
    ordering = ('-created_at',)

    @admin.display(description='Order ID')
    def short_id(self, obj):
        return str(obj.id)[:8].upper()

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            super().save_model(request, obj, form, change)
            try:
                from payments.views import push_order_update
                push_order_update(str(obj.id), obj.status)
            except Exception:
                pass
        else:
            super().save_model(request, obj, form, change)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id','user','updated_at')
    search_fields = ('user__email',)
