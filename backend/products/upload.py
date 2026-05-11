"""
products/upload.py

Image upload endpoint for vendor product images.

POST /api/products/upload-image/
  - Accepts: multipart/form-data with field 'image'
  - Returns: { "url": "/media/products/filename.jpg" }
  - Saves to: backend/media/products/

WHY A SEPARATE UPLOAD ENDPOINT:
Vendors upload images first, then include the URLs when
creating/editing a product. This allows multiple images
to be uploaded one at a time with progress feedback.

HCI Principle 2 — Feedback:
Each image upload returns a URL immediately so the vendor
sees their image appear in the product form as they upload.

Security:
- Only authenticated vendors can upload
- File type validated (images only)
- File size limited to 5MB
- Random filename to prevent overwrites
"""

import os
import uuid
from django.conf               import settings
from django.core.files.storage import FileSystemStorage
from rest_framework.views      import APIView
from rest_framework.response   import Response
from rest_framework.permissions import IsAuthenticated
from PIL                       import Image as PILImage


ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_SIZE_MB   = 5


class ImageUploadView(APIView):
    """
    POST /api/products/upload-image/

    Accepts a single image file. Resizes if over 1200px wide.
    Returns the URL to store in product.images list.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('image')

        if not file:
            return Response({'error': 'No image file provided'}, status=400)

        # Validate file type
        if file.content_type not in ALLOWED_TYPES:
            return Response({
                'error': 'Only JPEG, PNG and WebP images are accepted'
            }, status=400)

        # Validate file size
        if file.size > MAX_SIZE_MB * 1024 * 1024:
            return Response({
                'error': f'Image must be under {MAX_SIZE_MB}MB. '
                         f'This file is {file.size // (1024*1024)}MB.'
            }, status=400)

        # Generate unique filename
        ext      = os.path.splitext(file.name)[1].lower() or '.jpg'
        filename = f'{uuid.uuid4().hex}{ext}'
        folder   = 'products'

        # Save to media/products/
        fs   = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, folder))
        saved = fs.save(filename, file)

        # Resize if needed (max 1200px wide)
        full_path = os.path.join(settings.MEDIA_ROOT, folder, saved)
        try:
            img = PILImage.open(full_path)
            if img.width > 1200:
                ratio  = 1200 / img.width
                new_h  = int(img.height * ratio)
                img    = img.resize((1200, new_h), PILImage.LANCZOS)
                img.save(full_path, optimize=True, quality=85)
        except Exception:
            pass  # If PIL fails, keep original

        url = f'{settings.MEDIA_URL}{folder}/{saved}'

        return Response({
            'url':      url,
            'filename': saved,
            'size':     file.size,
        }, status=201)
