"""
users/vendor_views.py

Vendor dashboard API endpoints.

ENDPOINTS:
GET  /api/vendor/stats/          → sales summary (revenue, orders, products)
GET  /api/vendor/products/       → vendor's own products
POST /api/vendor/products/       → create new product
PUT  /api/vendor/products/{id}/  → edit a product
DEL  /api/vendor/products/{id}/  → delete a product
GET  /api/vendor/orders/         → orders containing vendor's products

All endpoints require authentication + role=vendor
"""

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework             import serializers
from django.db.models           import Sum, Count, Q
from django.utils               import timezone
from products.models            import Product, Category
from orders.models              import Order
from users.models               import VendorProfile


def vendor_required(view_func):
    """Decorator: ensure user has a vendor profile."""
    def wrapper(self, request, *args, **kwargs):
        if request.user.role not in ('vendor', 'admin'):
            return Response(
                {'error': 'Vendor account required'},
                status=403
            )
        try:
            request.vendor = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found. Complete onboarding first.'},
                status=403
            )
        return view_func(self, request, *args, **kwargs)
    return wrapper


# ── Serializers ───────────────────────────────────────────────────

class VendorProductSerializer(serializers.ModelSerializer):
    """Full product serializer for vendor (includes edit fields)."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'description', 'brand',
            'category', 'category_name',
            'price', 'promo_price', 'on_promo',
            'stock_qty', 'images', 'attributes',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'on_promo', 'promo_price', 'created_at', 'updated_at']


# ── Stats ─────────────────────────────────────────────────────────

class VendorStatsView(APIView):
    """
    GET /api/vendor/stats/

    Returns a dashboard summary for the vendor:
    - Total revenue (all time + this month)
    - Total orders (all time + today)
    - Active product count
    - Low stock alerts (stock_qty <= 3)
    - Top 5 best-selling products
    """
    permission_classes = [IsAuthenticated]

    @vendor_required
    def get(self, request):
        vendor  = request.vendor
        now     = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0)
        today_start = now.replace(hour=0, minute=0, second=0)

        # Products belonging to this vendor
        products = Product.objects.filter(vendor=vendor)

        # Orders containing this vendor's products
        # We look inside the JSONB items array for the vendor's product IDs
        product_ids = list(products.values_list('id', flat=True))
        product_ids_str = [str(p) for p in product_ids]

        # All confirmed orders (not draft) that contain vendor's products
        # We check via payment_status=paid for accuracy
        all_orders = Order.objects.filter(
            draft=False,
            payment_status='paid',
        )

        # Filter orders that contain at least one of vendor's products
        vendor_orders = [
            o for o in all_orders
            if any(
                str(item.get('product_id','')) in product_ids_str
                for item in (o.items or [])
            )
        ]

        # Calculate revenue from vendor's products only
        total_revenue = 0
        month_revenue = 0
        today_orders  = 0

        for order in vendor_orders:
            order_vendor_revenue = sum(
                item['price'] * item['qty']
                for item in (order.items or [])
                if str(item.get('product_id','')) in product_ids_str
            )
            total_revenue += order_vendor_revenue
            if order.created_at >= month_start:
                month_revenue += order_vendor_revenue
            if order.created_at >= today_start:
                today_orders += 1

        # Low stock products
        low_stock = products.filter(stock_qty__lte=3, stock_qty__gt=0, is_active=True)

        return Response({
            'revenue': {
                'total':       total_revenue,
                'this_month':  month_revenue,
            },
            'orders': {
                'total':  len(vendor_orders),
                'today':  today_orders,
            },
            'products': {
                'total':      products.count(),
                'active':     products.filter(is_active=True).count(),
                'out_of_stock': products.filter(stock_qty=0).count(),
                'low_stock':  low_stock.count(),
            },
            'low_stock_items': [
                {
                    'id':        str(p.id),
                    'name':      p.name,
                    'stock_qty': p.stock_qty,
                }
                for p in low_stock[:5]
            ],
            'commission_pct': float(vendor.commission_pct),
            'plan':           vendor.plan,
        })


# ── Products CRUD ─────────────────────────────────────────────────

class VendorProductListView(APIView):
    """
    GET  /api/vendor/products/ → list vendor's products
    POST /api/vendor/products/ → create new product
    """
    permission_classes = [IsAuthenticated]

    @vendor_required
    def get(self, request):
        vendor   = request.vendor
        products = Product.objects.filter(vendor=vendor).order_by('-created_at')

        # Filter by status
        status = request.query_params.get('status')
        if status == 'active':
            products = products.filter(is_active=True)
        elif status == 'inactive':
            products = products.filter(is_active=False)
        elif status == 'low_stock':
            products = products.filter(stock_qty__lte=3)
        elif status == 'out_of_stock':
            products = products.filter(stock_qty=0)

        return Response({
            'count':    products.count(),
            'products': VendorProductSerializer(products, many=True).data
        })

    @vendor_required
    def post(self, request):
        """
        Create a new product.

        Expected body:
        {
          "name":        "Samsung 43 TV",
          "description": "...",
          "brand":       "Samsung",
          "category":    1,
          "price":       1450000,
          "stock_qty":   10,
          "images":      ["/media/products/abc.jpg"],
          "attributes":  {"screen": "43 inches"}
        }
        """
        vendor = request.vendor
        data   = request.data

        # Auto-generate slug from name
        from django.utils.text import slugify
        import uuid
        base_slug = slugify(data.get('name', ''))
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        serializer = VendorProductSerializer(data={**data, 'slug': slug})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        product = serializer.save(vendor=vendor)

        return Response({
            'message': f'Product "{product.name}" created successfully.',
            'product': VendorProductSerializer(product).data,
        }, status=201)


class VendorProductDetailView(APIView):
    """
    GET /api/vendor/products/{id}/  → get single product
    PUT /api/vendor/products/{id}/  → update product
    DELETE /api/vendor/products/{id}/ → delete product
    """
    permission_classes = [IsAuthenticated]

    def get_product(self, request, product_id):
        """Get product ensuring it belongs to this vendor."""
        try:
            vendor  = request.user.vendor_profile
            product = Product.objects.get(id=product_id, vendor=vendor)
            return product, None
        except VendorProfile.DoesNotExist:
            return None, Response({'error': 'Vendor profile not found'}, status=403)
        except Product.DoesNotExist:
            return None, Response({'error': 'Product not found'}, status=404)

    def get(self, request, product_id):
        product, error = self.get_product(request, product_id)
        if error: return error
        return Response(VendorProductSerializer(product).data)

    def put(self, request, product_id):
        """
        Update a product. Vendor can update:
        - name, description, brand
        - price, stock_qty
        - images (full replacement of the list)
        - attributes
        - is_active (toggle visibility)

        Cannot update: promo_price, on_promo (controlled by promotions system)
        """
        product, error = self.get_product(request, product_id)
        if error: return error

        serializer = VendorProductSerializer(product, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response({
            'message': 'Product updated successfully.',
            'product': serializer.data,
        })

    def delete(self, request, product_id):
        """Soft delete — sets is_active=False rather than removing from DB."""
        product, error = self.get_product(request, product_id)
        if error: return error

        product.is_active = False
        product.save()
        return Response({'message': f'"{product.name}" removed from your listings.'})


# ── Vendor Orders ─────────────────────────────────────────────────

class VendorOrdersView(APIView):
    """
    GET /api/vendor/orders/

    Returns all confirmed orders that contain this vendor's products.
    Each order shows only the vendor's items (not other vendors' items).
    """
    permission_classes = [IsAuthenticated]

    @vendor_required
    def get(self, request):
        vendor      = request.vendor
        products    = Product.objects.filter(vendor=vendor)
        product_ids = [str(p.id) for p in products]

        # Get all paid, non-draft orders
        all_orders = Order.objects.filter(
            draft=False,
            payment_status='paid',
        ).order_by('-created_at')[:100]

        vendor_orders = []
        for order in all_orders:
            # Filter items to only this vendor's products
            my_items = [
                item for item in (order.items or [])
                if str(item.get('product_id','')) in product_ids
            ]
            if not my_items:
                continue

            my_revenue = sum(i['price'] * i['qty'] for i in my_items)
            commission = my_revenue * float(vendor.commission_pct) / 100
            payout     = my_revenue - commission

            vendor_orders.append({
                'order_id':      str(order.id),
                'order_date':    order.created_at.isoformat(),
                'status':        order.status,
                'district':      order.district,
                'my_items':      my_items,
                'my_revenue':    my_revenue,
                'commission':    round(commission),
                'payout':        round(payout),
            })

        return Response({
            'count':  len(vendor_orders),
            'orders': vendor_orders,
        })
