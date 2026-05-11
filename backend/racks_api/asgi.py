"""
racks_api/asgi.py

ASGI = Asynchronous Server Gateway Interface
This replaces the traditional WSGI server for Racks because
we need WebSocket support for live order tracking.

WHY ASGI OVER WSGI:
- WSGI (traditional Django): handles one HTTP request at a time, synchronously
- ASGI (Django Channels): handles HTTP + WebSockets simultaneously, asynchronously

The router here sends:
- HTTP requests → Django's normal request handler
- WebSocket connections → our OrderConsumer (live order tracking)

HCI Principle 2 — Feedback:
When an order status changes (paid → dispatched → delivered),
Django sends a WebSocket message to the user's browser.
The browser updates the tracking page in real-time without
the user needing to refresh.
"""

import os
from django.core.asgi   import get_asgi_application
from channels.routing   import ProtocolTypeRouter, URLRouter
from channels.auth      import AuthMiddlewareStack
from django.urls        import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'racks_api.settings')

# Must import Django app first before importing our consumers
django_asgi_app = get_asgi_application()

# Import after Django is set up
from orders.consumers import OrderConsumer

application = ProtocolTypeRouter({
    # Regular HTTP requests go through Django normally
    'http': django_asgi_app,

    # WebSocket connections go to our order tracking consumer
    # AuthMiddlewareStack reads the JWT token from the WebSocket handshake
    # so we know which user is watching which order
    'websocket': AuthMiddlewareStack(
        URLRouter([
            # ws://localhost:8000/ws/orders/ORDER-ID-HERE/
            # The browser connects to this URL to watch an order
            path('ws/orders/<str:order_id>/', OrderConsumer.as_asgi()),
        ])
    ),
})
