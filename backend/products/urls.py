from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ProductViewSet, CategoryViewSet
from .upload_views import ProductImageUploadView, ProductImageDeleteView

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('',           ProductViewSet,  basename='product')

urlpatterns = [
    # Image upload endpoints
    path('upload-image/',  ProductImageUploadView.as_view(),  name='upload_image'),
    path('delete-image/',  ProductImageDeleteView.as_view(),  name='delete_image'),
] + router.urls
