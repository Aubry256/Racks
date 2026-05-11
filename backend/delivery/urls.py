from rest_framework.routers import DefaultRouter
from .models import DeliveryZoneViewSet

router = DefaultRouter()
router.register('', DeliveryZoneViewSet, basename='deliveryzone')
urlpatterns = router.urls
