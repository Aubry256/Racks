from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import OrderViewSet, CartViewSet

router = DefaultRouter()
router.register('cart',   CartViewSet,  basename='cart')
router.register('',       OrderViewSet, basename='order')
urlpatterns = router.urls
