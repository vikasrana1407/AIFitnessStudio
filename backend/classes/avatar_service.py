"""
D-ID avatar talking-head video generation — clean abstraction.

Swap this module to integrate HeyGen / Synthesia / Tavus by re-implementing
`generate_avatar_video(text, ...) -> url`. Pipeline code never changes.

Auth: D-ID accepts the api_key as either Basic-encoded "email:password" or
"username:password". The keys you see in the wild already look like
"<email>:<token>" — we base64-encode them and send as Basic auth.
"""
import base64
import logging
import time
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

API_BASE = "https://api.d-id.com"

# Map studio avatar preference → D-ID source image (publicly hosted samples).
# Swap with your own studio avatars by uploading the source image to D-ID
# and pinning its CDN URL here.
DEFAULT_SOURCES = {
    "instructor_neutral":  "https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg",
    "instructor_warm":     "https://create-images-results.d-id.com/api_docs/assets/anna.jpeg",
    "instructor_athletic": "https://create-images-results.d-id.com/api_docs/assets/sofia.jpeg",
}

# Map our voice_preference → ElevenLabs voice id (same map as voice_service)
# D-ID can render with their own voices too; using ElevenLabs ids ensures the
# avatar voice matches the segment audio we generate.
DID_ELEVEN_VOICES = {
    "warm_female":   "EXAVITQu4vr4xnSDxMaL",
    "calm_female":   "21m00Tcm4Tlm",
    "bright_female": "AZnzlk1XvdvUeBnXmlld",
    "warm_male":     "TxGEqnHWrfWFTfGW9XjX",
    "focused_male":  "VR6AewLTigWG4xSOukaG",
}


def is_enabled() -> bool:
    return settings.USE_REAL_AVATAR and bool(settings.DID_API_KEY)


def _auth_header() -> str:
    raw = settings.DID_API_KEY
    # Encode "email:token" → base64 if it isn't already.
    if ":" in raw and not raw.endswith("="):
        raw = base64.b64encode(raw.encode()).decode()
    return f"Basic {raw}"


def generate_avatar_video(text: str, *,
                          avatar_preference: str = "instructor_neutral",
                          voice_preference: str = "warm_female",
                          poll_interval: float = 2.0,
                          timeout: int = 60) -> str:
    """
    Create a D-ID talking-head from `text` and return the resulting MP4 URL.

    On any failure returns "" — caller falls back to mock.
    """
    if not is_enabled():
        return ""
    source_url = DEFAULT_SOURCES.get(avatar_preference, settings.DID_DEFAULT_SOURCE_URL)
    voice_id = DID_ELEVEN_VOICES.get(voice_preference, DID_ELEVEN_VOICES["warm_female"])
    headers = {"Authorization": _auth_header(), "Content-Type": "application/json"}
    payload = {
        "source_url": source_url,
        "script": {
            "type": "text",
            "input": text[:1000],
            "provider": {
                "type": "elevenlabs",
                "voice_id": voice_id,
            } if settings.ELEVENLABS_API_KEY else {"type": "microsoft", "voice_id": "en-US-JennyNeural"},
        },
        "config": {"fluent": True, "pad_audio": 0.0},
    }
    if settings.ELEVENLABS_API_KEY:
        # D-ID supports passing the user's ElevenLabs key for premium voices.
        payload["script"]["provider"]["voice_config"] = {"stability": 0.5, "similarity_boost": 0.75}
        headers["x-api-key-external"] = (
            '{"elevenlabs":"' + settings.ELEVENLABS_API_KEY + '"}'
        )

    try:
        r = requests.post(f"{API_BASE}/talks", json=payload, headers=headers, timeout=30)
        if r.status_code >= 400:
            logger.warning("D-ID create failed (%s): %s", r.status_code, r.text[:300])
            return ""
        talk_id = r.json().get("id")
        if not talk_id:
            return ""
        # Poll until ready or timeout
        deadline = time.time() + timeout
        while time.time() < deadline:
            time.sleep(poll_interval)
            poll = requests.get(f"{API_BASE}/talks/{talk_id}", headers=headers, timeout=15)
            if poll.status_code >= 400:
                logger.warning("D-ID poll failed: %s", poll.text[:200])
                return ""
            data = poll.json()
            status = data.get("status")
            if status == "done":
                return data.get("result_url", "")
            if status in ("error", "rejected"):
                logger.warning("D-ID job ended in %s: %s", status, data)
                return ""
        logger.warning("D-ID job timed out for talk_id=%s", talk_id)
        return ""
    except Exception as exc:
        logger.warning("D-ID exception: %s", exc)
        return ""
