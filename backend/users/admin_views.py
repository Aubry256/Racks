"""
users/admin_views.py

Admin dashboard API endpoints.
These complement the Django admin panel (/admin) with
API endpoints that power a custom analytics dashboard.

ENDPOINTS:
GET /api/admin/stats/           → platform overview
GET /api/admin/orders/          → all orders with filters
PUT /api/admin/orders/{id}/     → update order status
GET /api/admin/vendors/pending/ → vendor applications to review
PUT /api/admin/vendors/{id}/    → approve or reject vendor
GET /api/admin/products/        → all products across all vendors

All require admin role.
"""

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils               import timezone
from django.db.models           import Count, Sum, Q
from datetime                   import timedelta
from orders.models              import Order
from products.models            import Product
from users.models               import User, VendorProfile
from payments.views             import push_order_update


class AdminStatsView(APIView):
    """
    GET /api/admin/stats/

    Platform-wide overview for the admin dashboard.
    Shows revenue, orders, users, and top products.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        now         = timezone.now()
        today       = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start  = today - timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0)

        # Paid orders
        paid_orders = Order.objects.filter(draft=False, payment_status='paid')

        # Revenue
        total_revenue = paid_orders.aggregate(t=Sum('total_amount'))['t'] or 0
        today_revenue = paid_orders.filter(created_at__gte=today).aggregate(t=Sum('total_amount'))['t'] or 0
        month_revenue = paid_orders.filter(created_at__gte=month_start).aggregate(t=Sum('total_amount'))['t'] or 0

        # Orders
        total_orders = paid_orders.count()
        today_orders = paid_orders.filter(created_at__gte=today).count()
        pending_orders = Order.objects.filter(draft=False, status='pending', payment_status='paid').count()

        # Users
        total_users    = User.objects.filter(role='customer').count()
        new_this_week  = User.objects.filter(created_at__gte=week_start, role='customer').count()

        # Vendors
        active_vendors  = VendorProfile.objects.filter(status='active').count()
        pending_vendors = VendorProfile.objects.filter(status='pending').count()

        # Products
        total_products    = Product.objects.filter(is_active=True).count()
        out_of_stock      = Product.objects.filter(is_active=True, stock_qty=0).count()

        # Revenue by day for the last 7 days (for chart)
        daily_revenue = []
        for i in range(6, -1, -1):
            day     = today - timedelta(days=i)
            day_end = day + timedelta(days=1)
            rev     = paid_orders.filter(
                created_at__gte=day,
                created_at__lt=day_end
            ).aggregate(t=Sum('total_amount'))['t'] or 0
            daily_revenue.append({
                'date':    day.strftime('%a'),
                'revenue': float(rev),
            })

        # Orders by status
        status_breakdown = {}
        for status in ['pending','processing','dispatched','delivered','cancelled']:
            status_breakdown[status] = Order.objects.filter(
                draft=False, status=status
            ).count()

        return Response({
            'revenue': {
                'total':       float(total_revenue),
                'today':       float(today_revenue),
                'this_month':  float(month_revenue),
                'daily_chart': daily_revenue,
            },
            'orders': {
                'total':   total_orders,
                'today':   today_orders,
                'pending': pending_orders,
                'by_status': status_breakdown,
            },
            'users': {
                'total':         total_users,
                'new_this_week': new_this_week,
            },
            'vendors': {
                'active':  active_vendors,
                'pending': pending_vendors,
            },
            'products': {
                'total':        total_products,
                'out_of_stock': out_of_stock,
            },
        })


class AdminOrdersView(APIView):
    """
    GET /api/admin/orders/?status=processing&district=Kampala
    Returns all orders with optional filters.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.filter(draft=False).order_by('-created_at')

        status   = request.query_params.get('status')
        district = request.query_params.get('district')
        payment  = request.query_params.get('payment_status')

        if status:   orders = orders.filter(status=status)
        if district: orders = orders.filter(district__iexact=district)
        if payment:  orders = orders.filter(payment_status=payment)

        # Paginate: 50 per page
        page     = int(request.query_params.get('page', 1))
        per_page = 50
        start    = (page - 1) * per_page
        end      = start + per_page

        data = []
        for o in orders[start:end]:
            data.append({
                'id':             str(o.id),
                'status':         o.status,
                'payment_status': o.payment_status,
                'total_amount':   float(o.total_amount),
                'district':       o.district,
                'payment_method': o.payment_method,
                'item_count':     sum(i.get('qty',1) for i in (o.items or [])),
                'created_at':     o.created_at.isoformat(),
            })

        return Response({
            'total': orders.count(),
            'page':  page,
            'orders': data,
        })


class AdminOrderDetailView(APIView):
    """
    PUT /api/admin/orders/{id}/

    Update order status. Pushes WebSocket notification to customer.

    HCI Principle 2 — Feedback:
    When admin marks an order as 'dispatched', the customer's
    tracking page instantly shows "Your rider is on the way!"
    """
    permission_classes = [IsAdminUser]

    def put(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        new_status = request.data.get('status')
        valid_statuses = ['pending','processing','dispatched','delivered','cancelled']

        if new_status not in valid_statuses:
            return Response({'error': f'Status must be one of: {", ".join(valid_statuses)}'}, status=400)

        old_status   = order.status
        order.status = new_status
        order.save()

        # Push real-time notification to customer's browser
        # HCI Principle 2 — Feedback
        push_order_update(str(order.id), new_status)

        return Response({
            'message':    f'Order status updated: {old_status} → {new_status}',
            'order_id':   str(order.id),
            'new_status': new_status,
            'notified':   True,
        })


class AdminPendingVendorsView(APIView):
    """
    GET /api/admin/vendors/pending/
    Returns vendor applications waiting for review.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = VendorProfile.objects.filter(status='pending').select_related('user')
        data = []
        for v in pending:
            data.append({
                'id':           v.id,
                'store_name':   v.store_name,
                'email':        v.user.email,
                'phone':        v.user.phone,
                'district':     v.district,
                'plan':         v.plan,
                'business_type':v.business_type,
                'tin_number':   v.tin_number,
                'applied_at':   v.created_at.isoformat(),
            })
        return Response({'count': len(data), 'vendors': data})


class AdminVendorActionView(APIView):
    """
    PUT /api/admin/vendors/{id}/
    Approve or reject a vendor application.
    Body: {"action": "approve"} or {"action": "reject"}
    """
    permission_classes = [IsAdminUser]

    def put(self, request, vendor_id):
        try:
            vendor = VendorProfile.objects.get(id=vendor_id)
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=404)

        action = request.data.get('action')
        if action == 'approve':
            vendor.status      = 'active'
            vendor.user.role   = 'vendor'
            vendor.user.save()
            vendor.save()
            return Response({'message': f'{vendor.store_name} approved and activated.'})

        elif action == 'reject':
            vendor.status = 'suspended'
            vendor.save()
            return Response({'message': f'{vendor.store_name} application rejected.'})

        return Response({'error': 'Action must be "approve" or "reject"'}, status=400)
