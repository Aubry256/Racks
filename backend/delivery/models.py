"""
delivery/models.py + views.py

HCI Principle 3 — Visibility:
This is the fix for the Dombelo problem where:
- Delivery said "Kiruhura" when address was "Mbarara"
- No delivery information shown on product pages
- Users couldn't know if Dombelo delivered to their district

Racks has a DeliveryZone table with:
- Every district in Uganda
- Whether we cover it
- How many days delivery takes
- The delivery fee

The product page calls /api/products/{id}/delivery/?district=Mbarara
and shows the result instantly.
"""

from django.db  import models
from rest_framework import viewsets, serializers
from rest_framework.permissions import AllowAny


class DeliveryZone(models.Model):
    """One row per Ugandan district we know about."""

    district      = models.CharField(max_length=100, unique=True)
    is_covered    = models.BooleanField(
        default=False,
        help_text='True if we deliver here'
    )
    delivery_days = models.IntegerField(
        default=3,
        help_text='Estimated delivery time in working days'
    )
    delivery_fee  = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Delivery fee in UGX. 0 = free delivery'
    )
    free_above    = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=200000,
        help_text='Orders above this amount get free delivery'
    )
    notes         = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['district']

    def __str__(self):
        status = 'covered' if self.is_covered else 'not covered'
        return f'{self.district} ({status}, {self.delivery_days} days)'


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DeliveryZone
        fields = ['id', 'district', 'is_covered', 'delivery_days', 'delivery_fee', 'free_above', 'notes']


class DeliveryZoneViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/delivery-zones/            → all districts
    GET /api/delivery-zones/?covered=true → only covered districts

    HCI Principle 5 — Constraints:
    The checkout district dropdown only shows covered districts.
    This prevents users from selecting a district we don't deliver to,
    which would cause a confusing error later.

    Compare Dombelo: user in Mbarara saw "Delivery to Kiruhura"
    because the system silently changed their district.
    """
    permission_classes = [AllowAny]
    serializer_class   = DeliveryZoneSerializer

    def get_queryset(self):
        qs = DeliveryZone.objects.all()
        # Filter to only covered districts if requested
        if self.request.query_params.get('covered') == 'true':
            qs = qs.filter(is_covered=True)
        return qs
