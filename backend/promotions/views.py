"""
promotions/models.py + views.py + tasks.py

The promotions system manages flash sales, clearance deals,
brand weeks and bundle offers.

HCI Principle 3 — Visibility:
Active promotions are shown prominently on the homepage.
The flash sale countdown timer is always accurate because
the scheduler activates and deactivates promos at exactly
the right time.

HCI Principle 7 — Simplicity:
One endpoint (/api/promotions/active/) gives the frontend
everything it needs for the homepage — flash sale, brand week,
clearance items — in one request.
"""

import uuid
from decimal         import Decimal
from django.db       import models
from django.utils    import timezone
from django.conf     import settings
from django.core.cache import cache
from rest_framework  import viewsets, serializers
from rest_framework.decorators  import action
from rest_framework.response    import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from celery          import shared_task


# ── Model ─────────────────────────────────────────────────────────

class Promotion(models.Model):
    """
    A promotional campaign.

    Types:
    - flash_sale:  Short-duration discount (e.g. 40% off Electronics today only)
    - clearance:   Permanent until stock runs out
    - bundle:      Buy 2, save 15%
    - brand_week:  All Samsung products 10% off this week

    Status lifecycle:
    draft → scheduled → live → ended
                     ↓
                  paused → live (can resume)
    """

    TYPE_CHOICES = [
        ('flash_sale', 'Flash Sale'),
        ('clearance',  'Clearance'),
        ('bundle',     'Bundle Deal'),
        ('brand_week', 'Brand Week'),
    ]
    STATUS_CHOICES = [
        ('draft',     'Draft'),      # Admin is building it
        ('scheduled', 'Scheduled'),  # Will go live at starts_at
        ('live',      'Live'),       # Currently active
        ('paused',    'Paused'),     # Temporarily stopped
        ('ended',     'Ended'),      # Finished
    ]
    APPLIES_CHOICES = [
        ('all',           'All Products'),
        ('category',      'Specific Category'),
        ('brand',         'Specific Brand'),
        ('selected_skus', 'Selected Products Only'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name         = models.CharField(max_length=200)
    promo_type   = models.CharField(max_length=30, choices=TYPE_CHOICES)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    applies_to   = models.CharField(max_length=30, choices=APPLIES_CHOICES, default='all')
    category_slug= models.CharField(max_length=100, blank=True)
    brand_name   = models.CharField(max_length=100, blank=True)
    min_qty      = models.IntegerField(default=1, help_text='Minimum quantity for bundle deals')
    starts_at    = models.DateTimeField()
    ends_at      = models.DateTimeField(null=True, blank=True, help_text='Leave blank = runs until stock out')
    auto_end_on_stockout = models.BooleanField(default=False)
    target_orders= models.IntegerField(null=True, blank=True)
    orders_count = models.IntegerField(default=0)
    created_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} [{self.status}]'


# ── Serializer ────────────────────────────────────────────────────

class PromotionSerializer(serializers.ModelSerializer):
    """
    HCI Principle 3 — Visibility:
    We add seconds_remaining so the frontend can show an accurate
    countdown timer without doing date math in the browser.

    We add progress_pct so the admin dashboard can show
    a progress bar toward the target orders.
    """
    seconds_remaining = serializers.SerializerMethodField()
    progress_pct      = serializers.SerializerMethodField()

    class Meta:
        model  = Promotion
        fields = [
            'id', 'name', 'promo_type', 'status',
            'discount_pct', 'applies_to', 'category_slug', 'brand_name',
            'starts_at', 'ends_at', 'seconds_remaining',
            'target_orders', 'orders_count', 'progress_pct',
            'created_at',
        ]

    def get_seconds_remaining(self, obj):
        if obj.ends_at:
            delta = obj.ends_at - timezone.now()
            return max(int(delta.total_seconds()), 0)
        return None

    def get_progress_pct(self, obj):
        if obj.target_orders and obj.target_orders > 0:
            return round((obj.orders_count / obj.target_orders) * 100, 1)
        return 0


# ── ViewSet ───────────────────────────────────────────────────────

class PromotionViewSet(viewsets.ModelViewSet):
    queryset         = Promotion.objects.all().order_by('-created_at')
    serializer_class = PromotionSerializer

    def get_permissions(self):
        # Anyone can read active promotions
        if self.action in ['list', 'retrieve', 'active']:
            return [AllowAny()]
        # Only admins can create/edit/delete promotions
        return [IsAdminUser()]

    def perform_create(self, serializer):
        """When admin creates a promotion, auto-set status."""
        obj = serializer.save(created_by=self.request.user)
        if obj.starts_at <= timezone.now():
            # Starts now — go live immediately
            obj.status = 'live'
            obj.save()
            _apply_promo_prices(obj)
        else:
            # Starts in the future — schedule it
            obj.status = 'scheduled'
            obj.save()
        # Clear the cached active promos
        cache.delete('promotions:active')

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /api/promotions/active/

        Returns all currently live promotions organised by type.
        This is called by the Next.js homepage to populate:
        - Flash sale banner with countdown timer
        - Brand week spotlight section
        - Clearance section

        HCI Principle 3 — Visibility:
        One endpoint, complete picture. Frontend doesn't need to
        make multiple calls or calculate anything.

        HCI Principle 7 — Simplicity:
        All homepage promo data in one response keeps the
        homepage rendering simple and fast.
        """
        # Cache for 60 seconds — promos don't change every second
        cache_key = 'promotions:active'
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        live = Promotion.objects.filter(status='live')
        data = {
            'flash_sale': None,   # One flash sale at a time
            'brand_week': None,   # One brand week at a time
            'clearance':  [],     # Multiple clearance campaigns
            'bundles':    [],     # Multiple bundle deals
        }

        for p in live:
            s = PromotionSerializer(p).data
            if   p.promo_type == 'flash_sale'  and not data['flash_sale']:
                data['flash_sale'] = s
            elif p.promo_type == 'brand_week'  and not data['brand_week']:
                data['brand_week'] = s
            elif p.promo_type == 'clearance':
                data['clearance'].append(s)
            elif p.promo_type == 'bundle':
                data['bundles'].append(s)

        cache.set(cache_key, data, timeout=60)
        return Response(data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Admin can pause a live promotion."""
        promo = self.get_object()
        promo.status = 'paused'
        promo.save()
        _clear_promo_prices(promo)
        cache.delete('promotions:active')
        return Response({'status': 'paused'})

    @action(detail=True, methods=['post'])
    def launch(self, request, pk=None):
        """Admin can force-launch a scheduled promotion."""
        promo = self.get_object()
        promo.status = 'live'
        promo.save()
        _apply_promo_prices(promo)
        cache.delete('promotions:active')
        return Response({'status': 'live'})


# ── Helpers ───────────────────────────────────────────────────────

def _get_qualifying_products(promo):
    """Get all products that should receive this promotion's discount."""
    from products.models import Product
    base = Product.objects.filter(is_active=True, stock_qty__gt=0)
    if promo.applies_to == 'category' and promo.category_slug:
        return base.filter(category__slug=promo.category_slug)
    elif promo.applies_to == 'brand' and promo.brand_name:
        return base.filter(brand__iexact=promo.brand_name)
    elif promo.applies_to == 'all':
        return base
    return base.none()


def _apply_promo_prices(promo):
    """Set promo_price on all qualifying products."""
    for product in _get_qualifying_products(promo):
        if promo.discount_pct:
            product.promo_price = round(
                product.price * (1 - Decimal(str(promo.discount_pct)) / 100), 0
            )
            product.on_promo = True
            product.save(update_fields=['promo_price', 'on_promo'])
        # Bust the cached promo price for this product
        cache.delete(f'promo_price:{product.id}')


def _clear_promo_prices(promo):
    """Remove promo pricing from all qualifying products."""
    for product in _get_qualifying_products(promo):
        product.promo_price = None
        product.on_promo    = False
        product.save(update_fields=['promo_price', 'on_promo'])
        cache.delete(f'promo_price:{product.id}')
    cache.delete('promotions:active')


# ── Celery Scheduled Tasks ────────────────────────────────────────

@shared_task
def check_and_activate_promotions():
    """
    Runs every 60 seconds (configured in settings.py CELERY_BEAT_SCHEDULE).
    Finds any promotions where starts_at has passed and status is 'scheduled'.
    Activates them — applies discount prices to all qualifying products.

    HCI Principle 3 — Visibility:
    The flash sale countdown on the homepage is accurate because
    this task fires exactly when the promotion is supposed to start.
    Users see "Ends in 04:23:41" and that timer is real.
    """
    due = Promotion.objects.filter(
        status    = 'scheduled',
        starts_at__lte = timezone.now(),  # starts_at <= now
    )
    for promo in due:
        promo.status = 'live'
        promo.save()
        _apply_promo_prices(promo)
        cache.delete('promotions:active')


@shared_task
def check_and_end_promotions():
    """
    Runs every 60 seconds.
    Ends promotions that have passed their ends_at time.
    """
    expired = Promotion.objects.filter(
        status  = 'live',
        ends_at__isnull = False,
        ends_at__lte    = timezone.now(),
    )
    for promo in expired:
        promo.status = 'ended'
        promo.save()
        _clear_promo_prices(promo)

    # Also end stockout promotions
    for promo in Promotion.objects.filter(status='live', auto_end_on_stockout=True):
        if not _get_qualifying_products(promo).filter(stock_qty__gt=0).exists():
            promo.status = 'ended'
            promo.save()
            _clear_promo_prices(promo)
