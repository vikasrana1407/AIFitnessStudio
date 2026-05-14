"""
Media storage abstraction.
- `local` (default): saves to MEDIA_ROOT, returns /media/<path> URL
- `s3`: saves to AWS_S3_BUCKET, returns public S3 URL

To run on AWS, set MEDIA_BACKEND=s3, AWS_S3_BUCKET=fitstudio-prod, plus
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or use an IAM role).

Application code should ONLY call `save_bytes(...)` so we can swap backends
without touching call sites.
"""
import os
import uuid
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)


def _build_local(path: str, data: bytes, content_type: str) -> str:
    full = Path(settings.MEDIA_ROOT) / path
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_bytes(data)
    return f"{settings.MEDIA_URL.rstrip('/')}/{path}"


def _build_s3(path: str, data: bytes, content_type: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
    )
    s3.put_object(
        Bucket=settings.AWS_S3_BUCKET,
        Key=path,
        Body=data,
        ContentType=content_type,
        ACL="public-read",
    )
    return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{path}"


def save_bytes(category: str, data: bytes, *, ext: str, content_type: str = "application/octet-stream", request=None) -> str:
    """
    Save `data` and return an absolute (request-aware) URL for the frontend.

    category: subfolder, e.g. "logos", "profile_pics", "audio", "video"
    ext:      file extension WITHOUT the dot, e.g. "png", "mp3"
    """
    name = f"{uuid.uuid4().hex}.{ext.lstrip('.')}"
    rel = f"{category}/{name}"
    backend = settings.MEDIA_BACKEND
    try:
        if backend == "s3":
            url = _build_s3(rel, data, content_type)
        else:
            url = _build_local(rel, data, content_type)
    except Exception as exc:
        logger.exception("Failed to save media (%s)", backend)
        raise
    # Make absolute when a request is available so the React frontend can
    # render images directly.
    if request is not None and url.startswith("/"):
        return request.build_absolute_uri(url)
    return url
