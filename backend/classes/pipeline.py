"""
Class-generation pipeline.

Steps:
  1. SCRIPT  — real LLM (Claude Sonnet 4.5 via emergentintegrations)
  2. VOICE   — ElevenLabs (real if USE_REAL_VOICE=true + key set, else MOCK)
  3. AVATAR  — D-ID Talks (real if USE_REAL_AVATAR=true + key set, else MOCK)
  4. RENDER  — MOCKED. Phase 3 will introduce FFmpeg stitching of intro/outro,
               branded overlays, exercise-demo clips and music ducking.

Runs in a daemon thread (Phase 2 swap with Celery for durability).
"""
import logging
import threading
import time
from django.db.models import Q
from django.utils import timezone
from django.conf import settings

from .models import FitnessClass, GenerationJob
from .llm_service import generate_class_script
from . import voice_service, avatar_service
from exercises.models import Exercise

logger = logging.getLogger(__name__)


def _start_job(fc, step):
    return GenerationJob.objects.create(
        fitness_class=fc, step=step, status="RUNNING", started_at=timezone.now(),
    )


def _finish_job(job, *, ok=True, message=""):
    job.status = "DONE" if ok else "FAILED"
    job.message = message
    job.completed_at = timezone.now()
    job.save()


def _update_class(fc, **kwargs):
    for k, v in kwargs.items():
        setattr(fc, k, v)
    fc.save()


def _approved_exercises_for(studio):
    qs = Exercise.objects.filter(is_approved=True).filter(
        Q(studio__isnull=True) | Q(studio=studio)
    )
    return list(qs.values(
        "id", "name", "category", "difficulty",
        "muscle_groups", "duration_seconds", "demo_video_url",
    ))


def _intro_text(fc) -> str:
    script = fc.script_json or {}
    intro = script.get("intro", {}).get("voice_script") or ""
    if intro:
        return intro
    # Fallback line if LLM gave us nothing
    return f"Welcome to {fc.title}. Let's begin a focused {fc.duration_minutes}-minute session."


def _run_pipeline(class_id):
    try:
        fc = FitnessClass.objects.get(id=class_id)
    except FitnessClass.DoesNotExist:
        return

    studio_voice = (fc.studio.voice_preference if fc.studio else "warm_female")
    studio_avatar = (fc.studio.avatar_preference if fc.studio else "instructor_neutral")

    try:
        # ── 1) SCRIPT ────────────────────────────────────────────────────
        _update_class(fc, status=FitnessClass.STATUS_SCRIPTING, progress_percent=10)
        job = _start_job(fc, "SCRIPT")
        approved = _approved_exercises_for(fc.studio)
        script = generate_class_script(
            title=fc.title, prompt=fc.prompt,
            duration_minutes=fc.duration_minutes,
            focus_area=fc.focus_area, difficulty=fc.difficulty,
            music_style=fc.music_style, approved_exercises=approved,
        )
        _update_class(
            fc, script_json=script,
            status=FitnessClass.STATUS_SCRIPT_READY, progress_percent=35,
        )
        _finish_job(job, ok=True, message=f"{len(script.get('segments', []))} segments generated")

        # ── 2) VOICE ─────────────────────────────────────────────────────
        _update_class(fc, status=FitnessClass.STATUS_VOICING, progress_percent=50)
        job = _start_job(fc, "VOICE")
        voice_url = ""
        message = "MOCKED voice generation complete"
        if voice_service.is_enabled():
            try:
                voice_url = voice_service.synthesize_voice(_intro_text(fc), voice_preference=studio_voice)
                if voice_url:
                    message = "Voice generated via ElevenLabs (intro line)"
            except Exception as exc:
                logger.warning("Voice step failed: %s", exc)
        if not voice_url:
            voice_url = f"https://mock.fitstudio.ai/voice/{fc.id}.mp3"
        _update_class(fc, voice_url=voice_url, progress_percent=65)
        _finish_job(job, ok=True, message=message)

        # ── 3) AVATAR ────────────────────────────────────────────────────
        _update_class(fc, status=FitnessClass.STATUS_AVATAR_RENDERING, progress_percent=75)
        job = _start_job(fc, "AVATAR")
        avatar_url = ""
        message = "MOCKED avatar render complete"
        if avatar_service.is_enabled():
            try:
                avatar_url = avatar_service.generate_avatar_video(
                    _intro_text(fc),
                    avatar_preference=studio_avatar,
                    voice_preference=studio_voice,
                )
                if avatar_url:
                    message = "Avatar rendered via D-ID (intro line)"
            except Exception as exc:
                logger.warning("Avatar step failed: %s", exc)
        if not avatar_url:
            avatar_url = f"https://mock.fitstudio.ai/avatar/{fc.id}.mp4"
        _update_class(fc, avatar_url=avatar_url, progress_percent=85)
        _finish_job(job, ok=True, message=message)

        # ── 4) RENDER (MOCKED — Phase 3 = FFmpeg) ───────────────────────
        _update_class(fc, status=FitnessClass.STATUS_RENDERING, progress_percent=92)
        job = _start_job(fc, "RENDER")
        time.sleep(1)
        # For now we surface the avatar clip as the "final" video so studios
        # have something playable end-to-end. Phase 3 will stitch:
        # intro screen → avatar intro → per-segment voice + exercise demo →
        # outro → music ducking, via FFmpeg/Remotion.
        final_url = avatar_url if avatar_url and "mock." not in avatar_url else \
            f"https://mock.fitstudio.ai/videos/{fc.id}.mp4"
        _update_class(fc, video_url=final_url,
                      status=FitnessClass.STATUS_RENDERED, progress_percent=100)
        _finish_job(job, ok=True, message="Final video ready (Phase 2 — FFmpeg pending)")

    except Exception as exc:
        logger.exception("Pipeline failed for class %s", class_id)
        try:
            fc.status = FitnessClass.STATUS_FAILED
            fc.error_message = str(exc)
            fc.save()
        except Exception:
            pass


def kickoff_pipeline(class_id):
    """Spawn a daemon thread to run the pipeline asynchronously."""
    t = threading.Thread(target=_run_pipeline, args=(str(class_id),), daemon=True)
    t.start()


def regenerate_segment(class_id, segment_index, instruction=""):
    """Regenerate one segment's voice_script using the LLM."""
    fc = FitnessClass.objects.get(id=class_id)
    script = fc.script_json or {}
    segments = script.get("segments", [])
    if segment_index < 0 or segment_index >= len(segments):
        raise ValueError("Invalid segment index")

    from .llm_service import _llm_generate_async, _extract_json
    import asyncio, uuid as _uuid

    seg = segments[segment_index]
    system = (
        "You are an expert pilates instructor. Rewrite the voice_script for one "
        "class segment based on the user's instruction. Return ONLY a JSON object: "
        '{"voice_script": str, "breathing_cue": str, "motivational_line": str}.'
    )
    user = f"Current segment: {seg}\nUser instruction: {instruction or 'Make it more energising'}"
    try:
        raw = asyncio.run(_llm_generate_async(system, user, f"regen-{_uuid.uuid4()}"))
        data = _extract_json(raw)
        for k in ("voice_script", "breathing_cue", "motivational_line"):
            if data.get(k):
                seg[k] = data[k]
    except Exception as exc:
        logger.warning("Regenerate fallback: %s", exc)
        seg["voice_script"] = f"(Refreshed) {seg.get('voice_script', '')} — bring breath and intention here."
    segments[segment_index] = seg
    script["segments"] = segments
    fc.script_json = script
    fc.save(update_fields=["script_json", "updated_at"])
    return fc
