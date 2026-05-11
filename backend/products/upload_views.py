"""
backend/products/upload_views.py

Image upload endpoint for vendor product images.

POST /api/products/upload-image/
- Accepts: multipart/form-data with 'image' file
- Returns: { "url": "/media/products/uuid-filename.jpg" }
- Vendor can upload multiple images, gets URL back to store in product.images

WHY FILE UPLOAD SEPARATELY:
Instead of submitting images with the product form (complex),
vendors upload images first, get URLs back, then include
those URLs when creating/editing the product.

This means:
- Images are uploaded instantly as vendor picks them
- Preview shown before product is saved
- Failed product save doesn't lose uploaded images
- Images can be reused across products

HCI Principle 2 — Feedback:
Upload progress shown, success/error immediately visible.
HCI Principle 5 — Constraints:
File type validated (jpg, png, webp only), max 5MB enforced.
"""

import os
import uuid
from django.conf              import settings
from django.core.files.storage import default_storage
from rest_framework.views     import APIView
from rest_framework.response  import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers   import MultiPartParser, FormParser


ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
MAX_SIZE_BYTES  = 5 * 1024 * 1024  # 5 MB


class ProductImageUploadView(APIView):
    """
    POST /api/products/upload-image/

    Uploads one image and returns its URL.

    Request: multipart/form-data
      image: <file>

    Response:
      { "url": "/media/products/abc123-filename.jpg", "name": "filename.jpg" }
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        # ── Validate file exists ──────────────────────────────────
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided. Include an image in the request.'},
                status=400
            )

        image_file = request.FILES['image']

        # ── Validate file type ───────────────────────────────────
        # HCI Principle 5 — Constraints: reject bad files early
        if image_file.content_type not in ALLOWED_TYPES:
            return Response(
                {'error': f'File type not supported. Upload a JPG, PNG, or WebP image.'},
                status=400
            )

        # ── Validate file size ───────────────────────────────────
        if image_file.size > MAX_SIZE_BYTES:
            size_mb = image_file.size / (1024 * 1024)
            return Response(
                {'error': f'Image is too large ({size_mb:.1f}MB). Maximum size is 5MB.'},
                status=400
            )

        # ── Generate unique filename ─────────────────────────────
        # Prefix with UUID to avoid filename collisions
        ext           = os.path.splitext(image_file.name)[1].lower()
        safe_name     = f'{uuid.uuid4().hex[:12]}{ext}'
        upload_path   = f'products/{safe_name}'

        # ── Save file ────────────────────────────────────────────
        saved_path = default_storage.save(upload_path, image_file)
        file_url   = f'{settings.MEDIA_URL}{saved_path}'

        return Response({
            'url':  file_url,
            'name': image_file.name,
            'size': image_file.size,
        }, status=201)


class ProductImageDeleteView(APIView):
    """
    DELETE /api/products/delete-image/

    Deletes an uploaded image by URL.
    Only vendor who owns the product can delete its images.

    Body: { "url": "/media/products/abc123.jpg" }
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        url = request.data.get('url', '')

        if not url or not url.startswith(settings.MEDIA_URL):
            return Response({'error': 'Invalid image URL'}, status=400)

        # Convert URL back to file path
        relative_path = url.replace(settings.MEDIA_URL, '')

        try:
            if default_storage.exists(relative_path):
                default_storage.delete(relative_path)
            return Response({'deleted': True})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
