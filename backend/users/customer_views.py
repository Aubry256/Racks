"""
users/customer_views.py

Customer dashboard API endpoints.

ENDPOINTS:
GET  /api/customer/profile/          → get profile
PUT  /api/customer/profile/          → update name, phone, district
PUT  /api/customer/password/         → change password
GET  /api/customer/orders/           → order history
GET  /api/customer/wishlist/         → saved items
POST /api/customer/wishlist/         → add item to wishlist
DEL  /api/customer/wishlist/{id}/    → remove from wishlist
GET  /api/customer/addresses/        → saved addresses
PUT  /api/customer/addresses/        → save/update addresses
"""

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework             import serializers
from orders.models              import Order
from users.models               import User
from django.db                  import models


# ── Wishlist Model ────────────────────────────────────────────────

class WishlistItem(models.Model):
    """
    A product saved to a customer's wishlist.

    HCI Principle 9 — Affordance:
    Dombelo had a Downloads section instead of a wishlist.
    Racks has a real, working wishlist that users can actually use.
    """
    user       = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    product_id = models.UUIDField()
    name       = models.CharField(max_length=255)
    price      = models.DecimalField(max_digits=12, decimal_places=2)
    image      = models.CharField(max_length=500, blank=True)
    brand      = models.CharField(max_length=100, blank=True)
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product_id']
        ordering        = ['-added_at']

    def __str__(self):
        return f'{self.user.email} → {self.name}'


# ── Address Model ─────────────────────────────────────────────────

class SavedAddress(models.Model):
    """
    Saved delivery addresses.

    HCI Principle 9 — Affordance:
    Dombelo merged billing and shipping into one field.
    Racks separates them and lets users save both.
    """
    TYPE_CHOICES = [
        ('billing',  'Billing Address'),
        ('shipping', 'Shipping / Delivery Address'),
    ]
    user         = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='shipping')
    label        = models.CharField(max_length=100, default='Home', help_text='e.g. Home, Office, Parents')
    line1        = models.CharField(max_length=255, help_text='Street / area description')
    district     = models.CharField(max_length=100)
    phone        = models.CharField(max_length=20, blank=True)
    is_default   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.label} — {self.line1}, {self.district}'


# ── Serializers ───────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id','email','full_name','phone','district','role','is_verified','created_at']
        read_only_fields = ['id','email','role','is_verified','created_at']


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WishlistItem
        fields = ['id','product_id','name','price','image','brand','added_at']
        read_only_fields = ['id','added_at']


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SavedAddress
        fields = ['id','address_type','label','line1','district','phone','is_default','created_at']
        read_only_fields = ['id','created_at']


class OrderSummarySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    first_item = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = ['id','status','payment_status','total_amount',
                  'district','payment_method','draft',
                  'item_count','first_item','created_at']

    def get_item_count(self, obj):
        return sum(i.get('qty',1) for i in (obj.items or []))

    def get_first_item(self, obj):
        items = obj.items or []
        return items[0].get('name','') if items else ''


# ── Views ─────────────────────────────────────────────────────────

class ProfileView(APIView):
    """GET/PUT /api/customer/profile/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response({'message': 'Profile updated.', 'user': serializer.data})


class ChangePasswordView(APIView):
    """PUT /api/customer/password/"""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        current  = request.data.get('current_password','')
        new_pass = request.data.get('new_password','')

        if not request.user.check_password(current):
            return Response({'error': 'Current password is incorrect'}, status=400)
        if len(new_pass) < 8:
            return Response({'error': 'New password must be at least 8 characters'}, status=400)

        request.user.set_password(new_pass)
        request.user.save()
        return Response({'message': 'Password changed successfully. Please log in again.'})


class CustomerOrdersView(APIView):
    """
    GET /api/customer/orders/

    Full order history for the logged-in customer.
    Includes all orders — paid, pending, draft, cancelled.

    HCI Principle 3 — Visibility:
    Customers can always see where every order stands.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            user=request.user
        ).order_by('-created_at')

        # Filter by status if requested
        status = request.query_params.get('status')
        if status:
            orders = orders.filter(status=status)

        return Response({
            'count':  orders.count(),
            'orders': OrderSummarySerializer(orders, many=True).data,
        })


class WishlistView(APIView):
    """
    GET  /api/customer/wishlist/ → get wishlist
    POST /api/customer/wishlist/ → add item

    HCI Principle 9 — Affordance:
    Real wishlist — fixes the Dombelo 'Downloads' confusion.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user)
        return Response({
            'count': items.count(),
            'items': WishlistSerializer(items, many=True).data,
        })

    def post(self, request):
        data = request.data
        # If already in wishlist, return existing
        existing = WishlistItem.objects.filter(
            user=request.user,
            product_id=data.get('product_id')
        ).first()
        if existing:
            return Response({'message': 'Already in wishlist', 'item': WishlistSerializer(existing).data})

        serializer = WishlistSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        item = serializer.save(user=request.user)
        return Response({
            'message': f'"{item.name}" added to wishlist.',
            'item': WishlistSerializer(item).data,
        }, status=201)


class WishlistItemView(APIView):
    """DELETE /api/customer/wishlist/{id}/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        try:
            item = WishlistItem.objects.get(id=item_id, user=request.user)
            name = item.name
            item.delete()
            return Response({'message': f'"{name}" removed from wishlist.'})
        except WishlistItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)


class AddressView(APIView):
    """
    GET /api/customer/addresses/ → all saved addresses
    POST /api/customer/addresses/ → save a new address

    HCI Principle 9 — Affordance:
    Billing and shipping are SEPARATE.
    Dombelo merged them — users couldn't set a different
    delivery address from their billing address.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = SavedAddress.objects.filter(user=request.user)
        return Response({
            'billing':  AddressSerializer(addresses.filter(address_type='billing'),  many=True).data,
            'shipping': AddressSerializer(addresses.filter(address_type='shipping'), many=True).data,
        })

    def post(self, request):
        # If new default, unset previous default of same type
        if request.data.get('is_default'):
            SavedAddress.objects.filter(
                user=request.user,
                address_type=request.data.get('address_type','shipping')
            ).update(is_default=False)

        serializer = AddressSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        address = serializer.save(user=request.user)
        return Response({
            'message': f'Address "{address.label}" saved.',
            'address': AddressSerializer(address).data,
        }, status=201)


class AddressDetailView(APIView):
    """PUT/DELETE /api/customer/addresses/{id}/"""
    permission_classes = [IsAuthenticated]

    def put(self, request, address_id):
        try:
            address = SavedAddress.objects.get(id=address_id, user=request.user)
        except SavedAddress.DoesNotExist:
            return Response({'error': 'Address not found'}, status=404)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response({'message': 'Address updated.', 'address': serializer.data})

    def delete(self, request, address_id):
        try:
            address = SavedAddress.objects.get(id=address_id, user=request.user)
            label   = address.label
            address.delete()
            return Response({'message': f'Address "{label}" deleted.'})
        except SavedAddress.DoesNotExist:
            return Response({'error': 'Address not found'}, status=404)
