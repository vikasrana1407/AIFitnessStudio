"""
ASGI entrypoint exposed as `app` so that the supervisor command
`uvicorn server:app --host 0.0.0.0 --port 8001` runs Django.
"""
import os
import django
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fitstudio.settings")
django.setup()

from django.core.asgi import get_asgi_application  # noqa: E402

app = get_asgi_application()
