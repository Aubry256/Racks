"""
products/views.py

The product API — the most-used part of Racks.

ENDPOINTS:
- GET /api/products/                    list all products
- GET /api/products/?category=phones   filter by category
- GET /api/products/?search=samsung    search products
- GET /api/products/{id}/              single product
- GET /api/products/{id}/delivery/     delivery info for a district
- GET /api/categories/                 all categories

HCI PRINCIPLES ADDRESSED:
- Principle 3 — Visibility: stock levels and delivery info always returned
- Principle 7 — Simplicity: clean, predictable URL structure
- Principle 8 — Mental Models: standard REST API pattern developers expect
"""

from rest_framework             import viewsets, filters, serializers
from rest_framework.decorators  import action
from rest_framework.response    import Response
from rest_framework.permissions import AllowAny
from django.core.cache          import cache
from .models                    import Category, Product
from delivery.models            import DeliveryZone


# ── Serializers ───────────────────────────────────────────────────
# Serializers convert Python objects ↔ JSON
# They also handle input validation

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'icon', 'parent']


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializes a Product to JSON for the API response.

    We add computed fields (current_price, saving_ugx, discount_pct)
    so the frontend never has to calculate anything.

    HCI Principle 3 — Visibility:
    Every field the user needs to make a purchase decision is returned.
    """

    # Name of the category (not just the ID)
    # e.g. "Electronics" not just 5
    category_name = serializers.CharField(source='category.name', read_only=True)

    # The actual price to pay right now (considering promotions)
    current_price = serializers.SerializerMethodField()

    # How much money the user saves (0 if not on promo)
    saving_ugx = serializers.SerializerMethodField()

    # Percentage discount (0 if not on promo)
    discount_pct = serializers.SerializerMethodField()

    # Whether the product is in stock
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description',
            'brand', 'category', 'category_name',
            'price', 'promo_price', 'on_promo',
            'current_price', 'saving_ugx', 'discount_pct',
            'stock_qty', 'in_stock',
            'images', 'attributes',
            'is_active', 'created_at',
        ]

    def get_current_price(self, obj):
        # Convert Decimal to float for JSON serialization
        return float(obj.current_price())

    def get_saving_ugx(self, obj):
        if obj.on_promo and obj.promo_price:
            return float(obj.price - obj.promo_price)
        return 0

    def get_discount_pct(self, obj):
        if obj.on_promo and obj.promo_price and obj.price > 0:
            return round(float((obj.price - obj.promo_price) / obj.price * 100))
        return 0

    def get_in_stock(self, obj):
        return obj.stock_qty > 0


# ── ViewSets ─────────────────────────────────────────────────────
# A ViewSet combines list + detail + create + update + delete
# into one class. DRF handles routing automatically.

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only — categories are managed through the admin panel.
    No authentication required — everyone can see categories.
    """
    permission_classes = [AllowAny]
    queryset           = Category.objects.filter(is_active=True)
    serializer_class   = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for products.
    - GET (list/detail) — public, no auth required
    - POST/PUT/DELETE   — requires admin authentication
    """
    serializer_class   = ProductSerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]

    # Fields users can search in: GET /api/products/?search=samsung
    search_fields  = ['name', 'brand', 'description', 'category__name']

    # Fields users can sort by: GET /api/products/?ordering=price
    ordering_fields = ['price', 'created_at', 'stock_qty']

    def get_permissions(self):
        # Reading products is public
        # Writing products requires admin
        if self.action in ['list', 'retrieve', 'delivery_info']:
            return [AllowAny()]
        from rest_framework.permissions import IsAdminUser
        return [IsAdminUser()]

    def get_queryset(self):
        """
        Build the product queryset with optional filters.
        All filters come from URL query parameters.

        Examples:
        GET /api/products/?category=electronics
        GET /api/products/?brand=samsung
        GET /api/products/?on_promo=true
        GET /api/products/?ordering=price   (cheapest first)
        GET /api/products/?ordering=-price  (most expensive first)
        """
        # Start with all active products, prefetch related category
        qs = Product.objects.filter(is_active=True).select_related('category', 'vendor')

        # Filter by category slug
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        # Filter by brand name (case-insensitive)
        brand = self.request.query_params.get('brand')
        if brand:
            qs = qs.filter(brand__iexact=brand)

        # Only show products currently on promotion
        on_promo = self.request.query_params.get('on_promo')
        if on_promo == 'true':
            qs = qs.filter(on_promo=True)

        # Only show in-stock products
        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            qs = qs.filter(stock_qty__gt=0)

        return qs

    # ── Custom action: delivery info ──────────────────────────
    # GET /api/products/{id}/delivery/?district=Kampala
    @action(detail=True, methods=['get'], url_path='delivery', permission_classes=[AllowAny])
    def delivery_info(self, request, pk=None):
        """
        Returns delivery coverage, fee and estimated days
        for a specific product and district combination.

        HCI Principle 3 — Visibility:
        This is the core fix for the Dombelo failure where
        users couldn't see delivery info on product pages.

        On Dombelo, a customer in Mbarara had no way to know
        if Dombelo even delivered to them.

        On Racks, the product page calls this endpoint with
        the user's district and shows:
        - Whether delivery is available
        - How many days it takes
        - The delivery fee (or FREE)

        The result is cached for 1 hour because delivery zones
        change rarely — no need to hit the database every time.
        """
        product  = self.get_object()
        district = request.query_params.get('district', 'Kampala')

        # Try to get from cache first (HCI P.3 — fast visibility)
        cache_key = f'delivery:{district.lower()}'
        cached    = cache.get(cache_key)

        if not cached:
            try:
                zone = DeliveryZone.objects.get(district__iexact=district)
                cached = {
                    'district':      zone.district,
                    'covered':       zone.is_covered,
                    'delivery_days': zone.delivery_days,
                    'delivery_fee':  str(zone.delivery_fee),
                    'free_above':    str(zone.free_above),
                    # Human-readable message for the UI
                    'message': (
                        f'Delivers to {zone.district} in {zone.delivery_days} day(s)'
                        + (f' · FREE' if zone.delivery_fee == 0 else f' · UGX {zone.delivery_fee:,.0f}')
                        if zone.is_covered
                        else f'Sorry — we don\'t deliver to {zone.district} yet.'
                    ),
                }
                # Cache for 1 hour
                cache.set(cache_key, cached, timeout=3600)

            except DeliveryZone.DoesNotExist:
                return Response({
                    'covered': False,
                    'message': 'District not found. Contact us to check availability.',
                }, status=404)

        return Response({
            **cached,
            # Also return live product info so one request gives everything
            'product_id':    str(product.id),
            'stock_qty':     product.stock_qty,
            'current_price': float(product.current_price()),
        })
