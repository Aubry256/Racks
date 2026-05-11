"""
orders/views.py

Order management API + WebSocket consumer for live tracking.

HCI PRINCIPLES:
- Principle 2 — Feedback: WebSocket pushes live status to browser
- Principle 4 — Error Recovery: draft=True pattern preserves orders
- Principle 3 — Visibility: order history always available
"""

import json
from rest_framework             import viewsets, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response    import Response
from rest_framework.decorators  import action
from channels.generic.websocket import AsyncWebsocketConsumer
from .models                    import Order, Cart


# ── Serializers ───────────────────────────────────────────────────

class CartSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    class Meta:
        model  = Cart
        fields = ['id', 'items', 'total', 'updated_at']

    def get_total(self, obj):
        return obj.total()


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'payment_status',
            'items', 'total_amount', 'delivery_fee',
            'delivery_address', 'district',
            'payment_method', 'payment_ref',
            'draft', 'promotion', 'notes',
            'created_at', 'updated_at',
        ]
        # These fields are set by the server, not the user
        read_only_fields = [
            'id', 'status', 'payment_status',
            'draft', 'created_at', 'updated_at',
        ]


# ── Cart ViewSet ──────────────────────────────────────────────────

class CartViewSet(viewsets.ViewSet):
    """
    GET  /api/orders/cart/        → get my cart
    POST /api/orders/cart/update/ → update cart items
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'], url_path='update-cart')
    def update_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items = request.data.get('items', [])
        cart.save()
        return Response(CartSerializer(cart).data)


# ── Order ViewSet ─────────────────────────────────────────────────

class OrderViewSet(viewsets.ModelViewSet):
    """
    POST /api/orders/     → create draft order (HCI P.4)
    GET  /api/orders/     → my order history
    GET  /api/orders/{id}/ → single order detail + tracking
    """
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request):
        """
        Create a new draft order.

        HCI Principle 4 — Error Recovery:
        THE KEY MOMENT: We save the order to the database HERE,
        BEFORE we call Flutterwave. This means:

        - If Flutterwave times out → order is saved
        - If the user closes the tab → order is saved
        - If MoMo prompt is rejected → order is saved
        - If Pesapal has a 500 error → order is saved (unlike Dombelo)

        The user can come back and retry payment without
        re-entering all their details or re-finding their items.
        """
        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ── SAVE DRAFT ORDER FIRST ────────────────────────────
        # draft=True: order exists but is not yet confirmed
        order = serializer.save(
            user  = request.user,
            draft = True,   # Will become False when payment succeeds
        )

        # Clear the cart now that we have an order
        # (the items are snapshotted in order.items already)
        try:
            Cart.objects.filter(user=request.user).update(items=[])
        except Exception:
            pass  # Don't fail if cart clear fails

        return Response({
            'order_id': str(order.id),
            'status':   'draft_saved',
            # HCI Principle 2 — Feedback: clear message about what happened
            # HCI Principle 4 — Error Recovery: user knows items are safe
            'message':  (
                'Your order has been saved. '
                'Proceed to payment — your items are safe even if payment fails.'
            ),
            'total':    float(order.total_amount),
        }, status=201)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def track(self, request, pk=None):
        """
        GET /api/orders/{id}/track/

        Public tracking endpoint — allows customers to track
        without being logged in (good for sharing tracking links).

        HCI Principle 3 — Visibility:
        Always show where the order is, in plain language.
        """
        try:
            order = Order.objects.get(id=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        return Response(OrderSerializer(order).data)


# ── WebSocket Consumer ────────────────────────────────────────────

class OrderConsumer(AsyncWebsocketConsumer):
    """
    Real-time order status updates via WebSocket.

    HCI Principle 2 — Feedback:
    This is the core feedback mechanism for Racks.

    When a user is on the order tracking page, their browser
    maintains an open WebSocket connection to this consumer.

    When anything changes (payment confirmed, dispatched, delivered),
    Django sends a message through Redis to this consumer,
    which immediately pushes it to the user's browser.

    The user sees "Your rider is on the way!" without refreshing.

    Compare with Dombelo:
    - Dombelo: no live updates, no notifications, complete silence
    - Racks:   instant push at every stage

    HOW IT WORKS:
    Browser connects → ws://localhost:8000/ws/orders/ORDER-UUID/
    Browser stays connected while on tracking page
    Server sends message → consumer pushes to browser
    Browser disconnects when user leaves the page
    """

    async def connect(self):
        """Called when browser opens the WebSocket connection."""
        # Get the order ID from the URL
        self.order_id   = self.scope['url_route']['kwargs']['order_id']
        # Each order has its own "channel group" — all watchers of an order
        # are in the same group, so they all receive the same messages
        self.group_name = f'order_{self.order_id}'

        # Join the channel group for this order
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

        # Send a confirmation that the connection is live
        # HCI Principle 2 — Feedback: user knows tracking is active
        await self.send(text_data=json.dumps({
            'type':    'connected',
            'message': 'Live tracking active. Updates will appear here automatically.',
        }))

    async def disconnect(self, close_code):
        """Called when browser closes the WebSocket connection."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def order_update(self, event):
        """
        Called by Django when an order status changes.
        Pushes the update to the connected browser.

        This method is called from payments/views.py when
        Flutterwave's webhook confirms a payment.
        """
        await self.send(text_data=json.dumps({
            'type':    'order_update',
            'status':  event['status'],
            'message': event['message'],
            # HCI Principle 2 — Feedback: human-readable status message
            # Not just a status code — "Your rider is on the way!"
            # not "status: dispatched"
        }))
