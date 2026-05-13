"""
LLM-based class script generator using the Emergent Universal LLM key
via the `emergentintegrations` library.

Falls back to a deterministic template if the LLM call fails so the POC
keeps moving even without network access.
"""
import os
import json
import re
import asyncio
import logging
import uuid
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def _build_system_prompt() -> str:
    return (
        "You are an expert fitness/pilates class designer. Given a class brief, "
        "produce a complete minute-by-minute class structure with spoken instructor "
        "script, breathing cues, posture/safety reminders, motivational coaching "
        "lines, and exercise demonstrations from the provided approved exercise "
        "library. Respond ONLY with a valid JSON object matching the schema below — "
        "no prose, no markdown fences. Schema:\n"
        "{\n"
        '  "intro": {"duration_seconds": int, "voice_script": str, "coaching_notes": str},\n'
        '  "segments": [{\n'
        '    "title": str, "minute_marker": int, "duration_seconds": int,\n'
        '    "exercise_name": str, "voice_script": str, "breathing_cue": str,\n'
        '    "safety_notes": str, "motivational_line": str,\n'
        '    "demo_required": bool\n'
        "  }],\n"
        '  "outro": {"duration_seconds": int, "voice_script": str},\n'
        '  "summary": str\n'
        "}\n"
        "Keep voice_script natural, conversational, under 280 chars per segment. "
        "Use exercise_name strictly from the approved library list when provided."
    )


def _build_user_message(
    title: str, prompt: str, duration_minutes: int, focus_area: str,
    difficulty: str, music_style: str, approved_exercises: List[Dict],
) -> str:
    lib_lines = "\n".join(
        f"- {ex['name']} ({ex['category']}, {ex['difficulty']})"
        for ex in approved_exercises[:60]
    )
    return (
        f"Class title: {title}\n"
        f"Brief: {prompt}\n"
        f"Duration: {duration_minutes} minutes\n"
        f"Focus area: {focus_area}\n"
        f"Difficulty: {difficulty}\n"
        f"Music style: {music_style}\n\n"
        f"Approved exercise library:\n{lib_lines}\n\n"
        f"Generate ~{max(4, duration_minutes // 3)} segments. Return JSON only."
    )


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract the first JSON object from a string, tolerating code fences."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    # try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    # find first '{' ... last '}'
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("Could not parse JSON from LLM response")


def _fallback_script(
    title: str, prompt: str, duration_minutes: int, focus_area: str,
    difficulty: str, approved_exercises: List[Dict],
) -> Dict[str, Any]:
    pool = [e for e in approved_exercises if e.get("category") != "WARMUP"] or approved_exercises
    n = max(4, min(8, duration_minutes // 4))
    segments = []
    for i in range(n):
        ex = pool[i % len(pool)] if pool else {"name": "Mat Bridge"}
        segments.append({
            "title": f"Segment {i + 1}: {ex['name']}",
            "minute_marker": int((i + 1) * (duration_minutes / (n + 1))),
            "duration_seconds": int((duration_minutes * 60) / (n + 2)),
            "exercise_name": ex["name"],
            "voice_script": (
                f"Let's flow into {ex['name']}. Engage your core, lengthen through "
                "the crown of your head, and move with intention."
            ),
            "breathing_cue": "Inhale to prepare, exhale as you engage.",
            "safety_notes": "Keep neutral spine. Stop if you feel sharp pain.",
            "motivational_line": "Strong body, calm mind — you've got this.",
            "demo_required": True,
        })
    return {
        "intro": {
            "duration_seconds": 60,
            "voice_script": (
                f"Welcome to {title}. Today we focus on {focus_area.replace('_', ' ').lower()}. "
                "Take a deep breath, find your center, and let's begin."
            ),
            "coaching_notes": "Smile, slow pace, set the tone.",
        },
        "segments": segments,
        "outro": {
            "duration_seconds": 45,
            "voice_script": (
                "Beautiful work today. Roll up slowly, hands to heart, "
                "and thank yourself for showing up."
            ),
        },
        "summary": f"{difficulty.title()} {focus_area.replace('_', ' ').lower()} session — {duration_minutes} min.",
    }


async def _llm_generate_async(system: str, user: str, session_id: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    response = await chat.send_message(UserMessage(text=user))
    return response if isinstance(response, str) else str(response)


def generate_class_script(
    *, title: str, prompt: str, duration_minutes: int, focus_area: str,
    difficulty: str, music_style: str, approved_exercises: List[Dict],
) -> Dict[str, Any]:
    """Synchronous wrapper that runs the async LLM call."""
    system = _build_system_prompt()
    user = _build_user_message(
        title, prompt, duration_minutes, focus_area,
        difficulty, music_style, approved_exercises,
    )
    session_id = f"class-{uuid.uuid4()}"
    try:
        raw = asyncio.run(_llm_generate_async(system, user, session_id))
        data = _extract_json(raw)
        # basic shape validation
        if not isinstance(data, dict) or "segments" not in data:
            raise ValueError("Invalid script shape")
        return data
    except Exception as exc:
        logger.warning("LLM script generation failed, using fallback: %s", exc)
        return _fallback_script(
            title, prompt, duration_minutes, focus_area, difficulty, approved_exercises,
        )
