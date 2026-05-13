"""
Orchestrates the end-to-end class generation pipeline.

Phase 1 (this build):
  - SCRIPT  → real LLM via Emergent Universal Key (claude sonnet 4.5)
  - VOICE   → MOCKED (placeholder URL after a brief simulated delay)
  - AVATAR  → MOCKED (placeholder URL)
  - RENDER  → MOCKED (placeholder URL)

Runs in a daemon thread so the API responds immediately.
"""
import logging
import threading
import time
from datetime import timedelta
from django.utils import timezone

from .models import FitnessClass, GenerationJob
from .llm_service import generate_class_script
from exercises.models import Exercise

logger = logging.getLogger(__name__)

# Lightweight thread-pool-less approach: one daemon per class
# (Phase 2: swap with Celery/RQ)


def _start_job(fc, step):
    job = GenerationJob.objects.create(
        fitness_class=fc, step=step, status="RUNNING",
        started_at=timezone.now(),
    )
    return job


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
    qs = Exercise.objects.filter(
        is_approved=True,
    ).filter(
        # system + studio-owned
        # (combined with .filter avoids cross-import of Q)
    )
    # apply studio + system filter
    from django.db.models import Q
    qs = qs.filter(Q(studio__isnull=True) | Q(studio=studio))
    return list(qs.values(
        "id", "name", "category", "difficulty",
        "muscle_groups", "duration_seconds", "demo_video_url",
    ))


def _run_pipeline(class_id):
    try:
        fc = FitnessClass.objects.get(id=class_id)
    except FitnessClass.DoesNotExist:
        return

    try:
        # 1) SCRIPT
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

        # 2) VOICE (MOCKED)
        _update_class(fc, status=FitnessClass.STATUS_VOICING, progress_percent=50)
        job = _start_job(fc, "VOICE")
        time.sleep(2)
        _update_class(
            fc, voice_url=f"https://mock.fitstudio.ai/voice/{fc.id}.mp3",
            progress_percent=65,
        )
        _finish_job(job, ok=True, message="MOCKED voice generation complete")

        # 3) AVATAR (MOCKED)
        _update_class(fc, status=FitnessClass.STATUS_AVATAR_RENDERING, progress_percent=75)
        job = _start_job(fc, "AVATAR")
        time.sleep(2)
        _update_class(
            fc, avatar_url=f"https://mock.fitstudio.ai/avatar/{fc.id}.mp4",
            progress_percent=85,
        )
        _finish_job(job, ok=True, message="MOCKED avatar render complete")

        # 4) RENDER (MOCKED)
        _update_class(fc, status=FitnessClass.STATUS_RENDERING, progress_percent=92)
        job = _start_job(fc, "RENDER")
        time.sleep(2)
        _update_class(
            fc, video_url=f"https://mock.fitstudio.ai/videos/{fc.id}.mp4",
            status=FitnessClass.STATUS_RENDERED, progress_percent=100,
        )
        _finish_job(job, ok=True, message="MOCKED final render complete")

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
    """Regenerate a single segment's voice_script using the LLM."""
    fc = FitnessClass.objects.get(id=class_id)
    script = fc.script_json or {}
    segments = script.get("segments", [])
    if segment_index < 0 or segment_index >= len(segments):
        raise ValueError("Invalid segment index")

    from .llm_service import _llm_generate_async  # reuse helper
    import asyncio, uuid as _uuid

    seg = segments[segment_index]
    system = (
        "You are an expert pilates instructor. Rewrite the voice_script for one "
        "class segment based on the user's instruction. Return ONLY a JSON object: "
        '{"voice_script": str, "breathing_cue": str, "motivational_line": str}.'
    )
    user = (
        f"Current segment: {seg}\n"
        f"User instruction: {instruction or 'Make it more energising'}"
    )
    try:
        raw = asyncio.run(_llm_generate_async(system, user, f"regen-{_uuid.uuid4()}"))
        from .llm_service import _extract_json
        data = _extract_json(raw)
        for k in ("voice_script", "breathing_cue", "motivational_line"):
            if data.get(k):
                seg[k] = data[k]
    except Exception as exc:
        logger.warning("Regenerate fallback: %s", exc)
        seg["voice_script"] = (
            f"(Refreshed) {seg.get('voice_script', '')} — bring breath and intention here."
        )
    segments[segment_index] = seg
    script["segments"] = segments
    fc.script_json = script
    fc.save(update_fields=["script_json", "updated_at"])
    return fc
