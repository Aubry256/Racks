from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, VendorProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email','full_name','role','phone','district','is_active','created_at')
    list_filter = ('role','is_active','is_verified')
    search_fields = ('email','full_name','phone')
    ordering = ('-created_at',)
    fieldsets = (
        (None,          {'fields': ('email','password')}),
        ('Profile',     {'fields': ('full_name','phone','district','role')}),
        ('Permissions', {'fields': ('is_active','is_staff','is_superuser','is_verified')}),
    )
    add_fieldsets = ((None, {'classes':('wide',),'fields':('email','password1','password2','full_name','role')}),)
    readonly_fields = ('created_at',)

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('store_name','user','plan','status','district','commission_pct','created_at')
    list_filter = ('status','plan')
    search_fields = ('store_name','user__email')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
