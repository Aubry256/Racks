from django.urls import path
from .views import InitiatePaymentView, flutterwave_webhook

urlpatterns = [
    # POST /api/payments/initiate/ — start a payment
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),

    # POST /api/payments/webhook/flutterwave/ — Flutterwave calls this
    # when payment succeeds or fails
    path('webhook/flutterwave/', flutterwave_webhook, name='flw_webhook'),
]
