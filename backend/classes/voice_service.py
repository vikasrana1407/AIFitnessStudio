"""
ElevenLabs voice generation — clean abstraction layer.

Replace the body of `synthesize_voice` with another provider (Polly, Google TTS,
OpenAI TTS) and the rest of the pipeline keeps working unchanged.
"""
import logging
import io
from django.conf import settings
from fitstudio import media_storage

logger = logging.getLogger(__name__)

# Default ElevenLabs voice IDs — handpicked from public library.
# Override per-segment by passing voice_id directly.
DEFAULT_VOICES = {
    "warm_female": "EXAVITQu4vr4xnSDxMaL",     # "Bella"
    "calm_female": "21m00Tcm4Tlm",              # "Rachel"
    "bright_female": "AZnzlk1XvdvUeBnXmlld",   # "Domi"
    "warm_male": "TxGEqnHWrfWFTfGW9XjX",       # "Josh"
    "focused_male": "VR6AewLTigWG4xSOukaG",    # "Arnold"
}


def is_enabled() -> bool:
    return settings.USE_REAL_VOICE and bool(settings.ELEVENLABS_API_KEY)


def _voice_id_for(preference: str) -> str:
    return DEFAULT_VOICES.get(preference or "warm_female", DEFAULT_VOICES["warm_female"])


def synthesize_voice(text: str, *, voice_preference: str = "warm_female", request=None) -> str:
    """
    Generate speech audio for `text` and return an addressable URL.

    Returns an empty string on failure (caller may fall back to mock).
    """
    if not is_enabled():
        return ""
    try:
        # Imported lazily so the module loads even when SDK isn't installed.
        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        stream = client.text_to_speech.convert(
            voice_id=_voice_id_for(voice_preference),
            model_id="eleven_multilingual_v2",
            text=text[:2500],   # ElevenLabs hard cap is high; keep payload sane
            output_format="mp3_44100_128",
        )
        buf = io.BytesIO()
        for chunk in stream:
            if chunk:
                buf.write(chunk)
        audio_bytes = buf.getvalue()
        if not audio_bytes:
            return ""
        return media_storage.save_bytes(
            "audio", audio_bytes, ext="mp3", content_type="audio/mpeg", request=request,
        )
    except Exception as exc:
        logger.warning("ElevenLabs voice synthesis failed: %s", exc)
        return ""
