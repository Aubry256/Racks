"""
payments/views.py

Flutterwave payment integration.

WHY FLUTTERWAVE:
We tested Pesapal during Dombelo evaluation and saw a 500 crash
mid-payment with no recovery. Flutterwave provides:
- Better error responses (specific codes, not blank 500s)
- Uganda MTN MoMo + Airtel Money + VISA/Mastercard
- Reliable webhook delivery with retry mechanism
- Test mode with simulated MoMo prompts (no real money for demo)
- Clear API documentation

THE PAYMENT FLOW:
                                    ┌─────────────┐
                                    │   Browser   │
                                    └──────┬──────┘
                                           │ 1. POST /api/payments/initiate/
                                           ▼
                                    ┌─────────────┐
                                    │   Django    │ 2. Save Payment record
                                    └──────┬──────┘
                                           │ 3. POST to Flutterwave API
                                           ▼
                                    ┌─────────────┐
                                    │ Flutterwave │ 4. Send MoMo prompt to phone
                                    └──────┬──────┘
                                           │ 5. User approves on phone
                                           │ 6. POST to /api/payments/webhook/
                                           ▼
                                    ┌─────────────┐
                                    │   Django    │ 7. Mark order as paid
                                    └──────┬──────┘
                                           │ 8. WebSocket push to browser
                                           ▼
                                    ┌─────────────┐
                                    │   Browser   │ 9. "Payment confirmed!" shown
                                    └─────────────┘

HCI Principles:
- P.2 — Feedback: step 9, real-time notification
- P.4 — Error Recovery: if step 3-6 fail, order stays as draft
- P.5 — Constraints: phone number validated before calling Flutterwave
"""

import uuid
import json
import requests
from django.conf                  import settings
from django.db                    import models
from django.http                  import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.views         import APIView
from rest_framework.response      import Response
from rest_framework.permissions   import IsAuthenticated
from channels.layers              import get_channel_layer
from asgiref.sync                 import async_to_sync
from orders.models                import Order


# ── Payment model ─────────────────────────────────────────────────

class Payment(models.Model):
    """
    Records every payment attempt.

    WHY SAVE FAILED PAYMENTS:
    Failed payments are valuable data:
    - How often does MoMo fail?
    - Which districts have more failures?
    - Is Flutterwave having issues?
    
    We also need the payment record to match Flutterwave's webhook
    with the correct order.
    """
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),  # We called Flutterwave
        ('pending',   'Pending'),    # Waiting for user to approve on phone
        ('success',   'Success'),    # Webhook confirmed payment
        ('failed',    'Failed'),     # Payment rejected or timed out
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    provider     = models.CharField(max_length=50, default='flutterwave')
    amount       = models.DecimalField(max_digits=12, decimal_places=2)
    currency     = models.CharField(max_length=10, default='UGX')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    provider_ref = models.CharField(max_length=255, blank=True, help_text='Flutterwave tx_ref')
    payload      = models.JSONField(default=dict, help_text='Raw webhook payload for debugging')
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Payment {self.provider_ref} — {self.status}'


# Human-readable status messages
# HCI Principle 2 — Feedback: specific, helpful messages
# Compare: Dombelo showed blank pages or generic errors
STATUS_MESSAGES = {
    'processing': 'Payment confirmed! Your order is being prepared.',
    'dispatched': 'Your order is on its way! Your rider will call before arriving. 🚚',
    'delivered':  'Order delivered. Thank you for shopping on Racks! ⭐',
    'cancelled':  'Order cancelled. Any payment will be refunded within 48 hours.',
}


def push_order_update(order_id: str, status: str):
    """
    Push a WebSocket message to all browsers watching this order.

    HCI Principle 2 — Feedback:
    This function is called whenever an order status changes.
    It immediately notifies the user's browser without them
    needing to refresh the page.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'order_{order_id}',
        {
            'type':    'order_update',      # Must match method name in OrderConsumer
            'status':  status,
            'message': STATUS_MESSAGES.get(status, 'Your order has been updated.'),
        }
    )


# ── Payment initiation ────────────────────────────────────────────

class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/

    Starts the payment process:
    1. Find the order
    2. Save a Payment record (so we can match the webhook later)
    3. Call Flutterwave API
    4. Return the payment link to the browser

    Body: {
        "order_id": "uuid",
        "phone": "0771234567"    ← MoMo number, already validated by frontend
    }

    Response: {
        "payment_link": "https://checkout.flutterwave.com/...",
        "tx_ref": "RK-ABCDEF123456",
        "message": "A prompt will be sent to your phone..."
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        phone    = request.data.get('phone', '')

        # Find the order — must belong to the logged-in user
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        # Generate a unique transaction reference
        # Format: RK-ABCDEF123456 (easy to find in Flutterwave dashboard)
        tx_ref = f'RK-{uuid.uuid4().hex[:14].upper()}'

        # ── SAVE PAYMENT RECORD BEFORE CALLING FLUTTERWAVE ────
        # HCI Principle 4 — Error Recovery:
        # Save the payment attempt BEFORE calling Flutterwave.
        # If Flutterwave is down, we still have a record of the attempt.
        # If the webhook arrives but we have no payment record, we'd lose it.
        payment = Payment.objects.create(
            order        = order,
            provider     = 'flutterwave',
            amount       = order.total_amount,
            status       = 'initiated',
            provider_ref = tx_ref,
        )

        # ── DEMO MODE ─────────────────────────────────────────
        # If no Flutterwave key is set (school demo), simulate payment
        if not settings.FLUTTERWAVE_SECRET or 'placeholder' in settings.FLUTTERWAVE_SECRET:
            # Simulate successful payment immediately
            payment.status = 'success'
            payment.save()
            order.payment_status = 'paid'
            order.status         = 'processing'
            order.draft          = False
            order.payment_ref    = tx_ref
            order.save()
            push_order_update(str(order.id), 'processing')

            return Response({
                'demo_mode':    True,
                'payment_link': f'http://localhost:3000/order/{order.id}',
                'tx_ref':       tx_ref,
                'message':      'Demo mode: payment simulated. In production, a MoMo prompt would be sent to your phone.',
            })

        # ── REAL FLUTTERWAVE CALL ─────────────────────────────
        payload = {
            'tx_ref':          tx_ref,
            'amount':          str(order.total_amount),
            'currency':        'UGX',
            # After payment, Flutterwave redirects user to this URL
            'redirect_url':    f'{settings.FRONTEND_URL}/order/{order.id}',
            'customer': {
                'email':       request.user.email,
                'phonenumber': phone or request.user.phone,
                'name':        request.user.full_name or request.user.email,
            },
            # Allow both MoMo and card payment
            'payment_options': 'mobilemoney,card',
            'meta':            {'order_id': str(order.id)},
        }

        headers = {
            'Authorization': f'Bearer {settings.FLUTTERWAVE_SECRET}',
            'Content-Type':  'application/json',
        }

        try:
            # Call Flutterwave API — 15 second timeout
            res  = requests.post(
                'https://api.flutterwave.com/v3/payments',
                json    = payload,
                headers = headers,
                timeout = 15,
            )
            data = res.json()

            if res.status_code == 200 and data.get('status') == 'success':
                return Response({
                    'payment_link': data['data']['link'],
                    'tx_ref':       tx_ref,
                    # HCI Principle 2 — Feedback:
                    # Specific message about what will happen next.
                    # Compare Dombelo: just redirected with no explanation.
                    # Compare Dombelo momo_invalid screenshot: accepted any input.
                    'message': (
                        'A payment prompt will be sent to your MTN or Airtel phone. '
                        'Approve it to complete your order. '
                        'If you don\'t receive it within 1 minute, tap "Resend".'
                    ),
                })

        except requests.RequestException as e:
            # Network error calling Flutterwave
            payment.status = 'failed'
            payment.save()
            return Response({
                # HCI Principle 4 — Error Recovery:
                # Tell the user their order is saved and they can retry.
                # Compare Dombelo: blank page or generic "error" with no guidance.
                'error':    (
                    'Could not connect to payment service. '
                    'Your order is saved — tap Retry to try again.'
                ),
                'order_id': str(order.id),
                'retryable': True,
            }, status=502)

        # Flutterwave returned an error response
        payment.status = 'failed'
        payment.save()
        return Response({
            'error':     data.get('message', 'Payment initiation failed. Your order is saved.'),
            'order_id':  str(order.id),
            'retryable': True,
        }, status=400)


# ── Flutterwave Webhook ───────────────────────────────────────────

@csrf_exempt  # Flutterwave can't send CSRF tokens — exempt this endpoint
@require_POST
def flutterwave_webhook(request):
    """
    POST /api/payments/webhook/flutterwave/

    Flutterwave calls this endpoint when a payment is completed.
    This is the moment where:
    - The order becomes real (draft=False)
    - The user gets a notification
    - The order status changes to 'processing'

    SECURITY:
    We verify the 'verif-hash' header matches our webhook secret.
    This proves the request really came from Flutterwave,
    not from someone faking a payment confirmation.

    HCI Principle 4 — Error Recovery:
    This webhook also fires when payments FAIL.
    We record the failure but keep the draft order alive.
    """
    # ── Verify the request is really from Flutterwave ─────────
    secret    = settings.FLUTTERWAVE_WEBHOOK
    signature = request.headers.get('verif-hash', '')

    if secret and signature != secret:
        # Request not from Flutterwave — reject it
        return HttpResponse(status=401)

    # ── Parse the webhook payload ─────────────────────────────
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    event = payload.get('event')
    data  = payload.get('data', {})

    # We only care about completed charge events
    if event == 'charge.completed':
        tx_ref = data.get('tx_ref', '')

        # Find the payment record we created during initiation
        try:
            payment = Payment.objects.select_related('order').get(provider_ref=tx_ref)
        except Payment.DoesNotExist:
            # Unknown transaction — log and ignore
            return HttpResponse(status=200)

        if data.get('status') == 'successful':
            # ── PAYMENT SUCCEEDED ─────────────────────────────
            payment.status  = 'success'
            payment.payload = data  # Save full response for records
            payment.save()

            order                = payment.order
            order.payment_status = 'paid'
            order.status         = 'processing'
            order.draft          = False      # Order is now confirmed
            order.payment_ref    = tx_ref
            order.save()

            # Push real-time notification to the user's browser
            # HCI Principle 2 — Feedback
            push_order_update(str(order.id), 'processing')

        else:
            # ── PAYMENT FAILED ────────────────────────────────
            payment.status  = 'failed'
            payment.payload = data
            payment.save()

            # Order remains as draft=True
            # HCI Principle 4 — Error Recovery:
            # User can retry payment without losing their order

    # Always return 200 to Flutterwave — otherwise they'll retry the webhook
    return HttpResponse(status=200)
