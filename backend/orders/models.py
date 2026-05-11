"""
orders/models.py

Two models: Cart and Order.

The MOST IMPORTANT HCI principle in this file is Principle 4 — Error Recovery.

THE DOMBELO PROBLEM WE SAW:
When a MoMo payment failed on Dombelo, the user lost their entire cart.
They had to find every product again and start checkout from scratch.
This is a catastrophic UX failure — especially for large orders.

THE RACKS SOLUTION:
1. User adds items to Cart (saved to database, not just browser memory)
2. User submits checkout → Order is created immediately with draft=True
3. THEN we call Flutterwave
4. If payment succeeds → order.draft = False (confirmed)
5. If payment fails → order STAYS with draft=True
6. User can retry payment without losing anything

This is the draft-first pattern. The order exists before payment.
"""

import uuid
from django.db   import models
from django.conf import settings


class Cart(models.Model):
    """
    Persistent shopping cart.

    WHY SAVE THE CART TO THE DATABASE:
    If we only store the cart in the browser (localStorage),
    it disappears when the user:
    - Clears their browser data
    - Switches devices
    - Has a browser crash

    Saving to database means the cart survives anything.

    HCI Principle 4 — Error Recovery:
    If a payment fails, the cart still exists.
    The user just tries again.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Cart belongs to a logged-in user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart',
    )

    # For users browsing without an account (guest checkout)
    session_id = models.CharField(max_length=255, blank=True)

    # Cart items stored as JSON array
    # Format: [
    #   {
    #     "product_id": "uuid",
    #     "name": "Samsung 43 TV",
    #     "price": 1450000,     ← price at time of adding (locked in)
    #     "qty": 1,
    #     "image": "/media/...",
    #     "brand": "Samsung"
    #   }
    # ]
    # WHY JSON: Cart contents vary per user, no fixed schema needed
    items = models.JSONField(
        default=list,
        help_text='List of cart items with price, qty, and product details'
    )

    updated_at = models.DateTimeField(auto_now=True)

    def total(self):
        """Calculate total price of all items in the cart."""
        return sum(item['price'] * item['qty'] for item in self.items)

    def __str__(self):
        item_count = sum(i['qty'] for i in self.items)
        return f'Cart ({item_count} items, UGX {self.total():,.0f})'


class Order(models.Model):
    """
    A customer's order.

    THE DRAFT PATTERN (HCI Principle 4 — Error Recovery):
    ┌─────────────────────────────────────────────────────┐
    │  draft=True  = Order saved, payment not confirmed   │
    │  draft=False = Payment confirmed, order is live     │
    └─────────────────────────────────────────────────────┘

    Flow:
    1. POST /api/orders/ → creates order with draft=True
    2. POST /api/payments/initiate/ → calls Flutterwave
    3a. Payment succeeds → webhook sets draft=False, status='processing'
    3b. Payment fails   → order stays draft=True
                          user sees "Your order is saved, try again"
                          cart is NOT wiped (HCI P.4)
    """

    # Order status reflects where the physical item is
    STATUS_CHOICES = [
        ('pending',    'Pending'),     # Order placed, not yet paid
        ('processing', 'Processing'),  # Payment confirmed, being prepared
        ('dispatched', 'Dispatched'),  # Handed to delivery rider
        ('delivered',  'Delivered'),   # Customer received it
        ('cancelled',  'Cancelled'),   # Order cancelled
    ]

    # Payment status is separate from order status
    # An order can be delivered even if payment is 'paid' (via MoMo)
    PAYMENT_STATUS_CHOICES = [
        ('unpaid',   'Unpaid'),    # No payment yet
        ('paid',     'Paid'),      # Flutterwave confirmed payment
        ('failed',   'Failed'),    # Payment attempted but failed
        ('refunded', 'Refunded'),  # Money returned to customer
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Nullable: if user deletes account, keep the order for records
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='orders',
    )

    status         = models.CharField(max_length=20, choices=STATUS_CHOICES,         default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')

    # Snapshot of cart items at order time
    # WHY SNAPSHOT: If a product's price changes or it's deleted,
    # the order still has the correct price the customer paid
    items = models.JSONField(
        help_text='Snapshot of cart items at the time the order was placed'
    )

    # Pricing
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Delivery information
    # Stored as JSON: {"line1": "Ntinda near Shell", "district": "Kampala"}
    delivery_address = models.JSONField(
        default=dict,
        help_text='Full delivery address as provided at checkout'
    )
    district = models.CharField(max_length=100)

    # Payment information
    payment_method = models.CharField(max_length=50, blank=True)  # 'momo', 'airtel', 'cod'
    payment_ref    = models.CharField(max_length=255, blank=True)  # Flutterwave transaction ref

    # ── THE CRITICAL FIELD ────────────────────────────────────
    # HCI Principle 4 — Error Recovery
    # draft=True  means: order saved, waiting for payment
    # draft=False means: payment confirmed, order is active
    # This field is set to True on creation and only becomes False
    # when Flutterwave's webhook confirms successful payment
    draft = models.BooleanField(
        default=True,
        help_text=(
            'True = order saved but payment not yet confirmed. '
            'False = payment confirmed, order is active. '
            'Draft orders are preserved even if payment fails, '
            'allowing the user to retry without losing their items.'
        )
    )

    # Which promotion (if any) was applied to this order
    promotion = models.ForeignKey(
        'promotions.Promotion',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text='Promotion that provided a discount on this order'
    )

    notes      = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['draft']),  # quickly find unpaid orders
        ]

    def __str__(self):
        return f'Order #{str(self.id)[:8].upper()} — {self.status} (draft={self.draft})'
