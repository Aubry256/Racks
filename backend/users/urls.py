from django.urls import path
from .views import RegisterView, VendorOnboardView
from .auth_views import LoginView, LogoutView, ForgotPasswordView, ResetPasswordView, SendVerificationEmailView, VerifyEmailView
from .vendor_views import VendorStatsView, VendorProductListView, VendorProductDetailView, VendorOrdersView
from .customer_views import ProfileView, ChangePasswordView, CustomerOrdersView, WishlistView, WishlistItemView, AddressView, AddressDetailView
from .admin_views import AdminStatsView, AdminOrdersView, AdminOrderDetailView, AdminPendingVendorsView, AdminVendorActionView
from products.upload import ImageUploadView

urlpatterns = [
    # Auth
    # Auth endpoints
    path('login/',              LoginView.as_view(),                name='login'),
    path('logout/',             LogoutView.as_view(),               name='logout'),
    path('forgot-password/',    ForgotPasswordView.as_view(),       name='forgot_password'),
    path('reset-password/',     ResetPasswordView.as_view(),        name='reset_password'),
    path('send-verification/',  SendVerificationEmailView.as_view(),name='send_verification'),
    path('verify-email/',       VerifyEmailView.as_view(),          name='verify_email'),
    path('register/',      RegisterView.as_view(),      name='register'),
    path('vendor/',        VendorOnboardView.as_view(), name='vendor_onboard'),
    # Image upload
    path('upload-image/',  ImageUploadView.as_view(),   name='image_upload'),
    # Vendor dashboard
    path('vendor/stats/',                         VendorStatsView.as_view(),         name='vendor_stats'),
    path('vendor/products/',                      VendorProductListView.as_view(),   name='vendor_products'),
    path('vendor/products/<str:product_id>/',     VendorProductDetailView.as_view(), name='vendor_product_detail'),
    path('vendor/orders/',                        VendorOrdersView.as_view(),        name='vendor_orders'),
    # Customer dashboard
    path('customer/profile/',                     ProfileView.as_view(),             name='profile'),
    path('customer/password/',                    ChangePasswordView.as_view(),      name='change_password'),
    path('customer/orders/',                      CustomerOrdersView.as_view(),      name='customer_orders'),
    path('customer/wishlist/',                    WishlistView.as_view(),            name='wishlist'),
    path('customer/wishlist/<int:item_id>/',      WishlistItemView.as_view(),        name='wishlist_item'),
    path('customer/addresses/',                   AddressView.as_view(),             name='addresses'),
    path('customer/addresses/<int:address_id>/',  AddressDetailView.as_view(),       name='address_detail'),
    # Admin dashboard
    path('admin/stats/',                          AdminStatsView.as_view(),          name='admin_stats'),
    path('admin/orders/',                         AdminOrdersView.as_view(),         name='admin_orders'),
    path('admin/orders/<str:order_id>/',          AdminOrderDetailView.as_view(),    name='admin_order_detail'),
    path('admin/vendors/pending/',                AdminPendingVendorsView.as_view(), name='admin_pending_vendors'),
    path('admin/vendors/<int:vendor_id>/',        AdminVendorActionView.as_view(),   name='admin_vendor_action'),
]
