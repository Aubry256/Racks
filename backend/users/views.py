"""
users/views.py

API endpoints for user management:
- POST /api/auth/register/     → create customer account
- POST /api/auth/vendor/       → apply to become a vendor

WHY SEPARATE REGISTER FROM VENDOR ONBOARD:
Regular customers just need email + password.
Vendors need store details, bank info, plan selection.
Combining them in one endpoint would make both flows worse.

HCI Principle 7 — Simplicity:
Keep each form focused on one task.
"""

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.text          import slugify
from .models                    import User, VendorProfile


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new customer account and returns JWT tokens
    so the user is immediately logged in after registering.

    HCI Principle 6 — Learnability:
    Return a clear success response with the user's name
    so the frontend can show a personalised welcome message.
    """
    # No authentication required — anyone can register
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # Check email not already taken
        if User.objects.filter(email=data.get('email', '')).exists():
            return Response(
                # HCI Principle 2 — Feedback:
                # Specific error message, not a generic "error occurred"
                {'error': 'This email is already registered. Try logging in instead.'},
                status=400
            )

        # Validate required fields
        required = ['email', 'password']
        for field in required:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'},
                    status=400
                )

        # Create the user
        user = User.objects.create_user(
            email     = data['email'],
            password  = data['password'],
            full_name = data.get('full_name', ''),
            phone     = data.get('phone', ''),
            district  = data.get('district', ''),
            role      = 'customer',
        )

        # Generate JWT tokens — user is logged in immediately
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': f'Welcome to Racks, {user.full_name or user.email.split("@")[0]}!',
            'user': {
                'id':        str(user.id),
                'email':     user.email,
                'full_name': user.full_name,
                'role':      user.role,
            },
            # These tokens go into the browser's localStorage
            # All future API requests send: Authorization: Bearer <access>
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)


class VendorOnboardView(APIView):
    """
    POST /api/auth/vendor/

    5-step vendor onboarding flow (matches the GUI we built):
    Step 1: Account (email, password, name, phone)
    Step 2: Business (store name, district, description)
    Step 3: Categories (what they sell)
    Step 4: Plan (starter or pro)
    Step 5: Review → submit (this endpoint)

    Application goes into 'pending' status.
    Admin reviews it in the Django admin panel.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # Create user account if it doesn't exist
        user, created = User.objects.get_or_create(
            email=data.get('email', ''),
            defaults={
                'full_name': data.get('full_name', ''),
                'phone':     data.get('phone', ''),
                'role':      'vendor',
            }
        )
        if created:
            user.set_password(data.get('password', ''))
            user.save()

        # Generate unique store slug from store name
        # e.g. "TechEast Uganda" → "techeast-uganda"
        store_name = data.get('store_name', user.full_name)
        base_slug  = slugify(store_name)
        slug, counter = base_slug, 1
        while VendorProfile.objects.filter(store_slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        # Set commission based on chosen plan
        plan       = data.get('plan', 'starter')
        commission = 5.00 if plan == 'pro' else 8.00

        # Create or update vendor profile
        profile, _ = VendorProfile.objects.update_or_create(
            user=user,
            defaults={
                'store_name':    store_name,
                'store_slug':    slug,
                'description':   data.get('description', ''),
                'district':      data.get('district', ''),
                'business_type': data.get('business_type', ''),
                'tin_number':    data.get('tin_number', ''),
                'plan':          plan,
                'payout_phone':  data.get('payout_phone', user.phone),
                'commission_pct':commission,
                'status':        'pending',
            }
        )

        return Response({
            'message': 'Application received. Our team will review within 24 hours.',
            'store_slug': profile.store_slug,
            'status':     profile.status,
        }, status=201)
