"""
Generic file-upload endpoints. Returns the addressable URL to the frontend.

Used for:
- Profile pictures (POST /api/uploads/profile-picture)
- Studio logos       (POST /api/uploads/studio-logo)

All uploads stream through media_storage so swapping local → S3 is one env flip.
"""
from PIL import Image, UnidentifiedImageError
import io

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from fitstudio import media_storage

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_BYTES = 4 * 1024 * 1024  # 4 MB


def _validate_image(file_obj):
    ct = (file_obj.content_type or "").lower()
    if ct not in ALLOWED_IMAGE_TYPES:
        return None, f"Unsupported file type: {ct}"
    data = file_obj.read()
    if len(data) > MAX_BYTES:
        return None, "File too large (max 4 MB)"
    try:
        Image.open(io.BytesIO(data)).verify()
    except (UnidentifiedImageError, Exception):
        return None, "Could not read image"
    ext = "jpg" if ct in ("image/jpeg", "image/jpg") else ct.split("/")[-1]
    return (data, ext, ct), None


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    file_obj = request.FILES.get("file") or request.FILES.get("image")
    if not file_obj:
        return Response({"detail": "No file provided"}, status=400)
    res, err = _validate_image(file_obj)
    if err:
        return Response({"detail": err}, status=400)
    data, ext, ct = res
    url = media_storage.save_bytes("profile_pics", data, ext=ext, content_type=ct, request=request)
    user = request.user
    user.profile_picture_url = url
    user.save(update_fields=["profile_picture_url"])
    return Response({"url": url})


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_studio_logo(request):
    file_obj = request.FILES.get("file") or request.FILES.get("image")
    if not file_obj:
        return Response({"detail": "No file provided"}, status=400)
    user = request.user
    if not user.studio_id:
        return Response({"detail": "User has no studio"}, status=400)
    if user.role not in ("OWNER", "SUPER_ADMIN"):
        return Response({"detail": "Permission denied"}, status=403)
    res, err = _validate_image(file_obj)
    if err:
        return Response({"detail": err}, status=400)
    data, ext, ct = res
    url = media_storage.save_bytes("logos", data, ext=ext, content_type=ct, request=request)
    studio = user.studio
    studio.logo_url = url
    studio.save(update_fields=["logo_url", "updated_at"])
    return Response({"url": url})
