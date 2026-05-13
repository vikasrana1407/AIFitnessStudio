# FitStudio AI — PRD

## Original problem statement
Build a scalable AI-powered SaaS platform for boutique fitness studios that
auto-generates complete guided fitness class videos from a text brief. Multi-tenant,
pilot = pilates studio. Modules required (per the brief):
1. SaaS architecture & multi-tenant platform
2. AI class generation (LLM)
3. Exercise library system
4. Voice generation (ElevenLabs)
5. Avatar video generation (HeyGen/Synthesia/Tavus/D-ID)
6. Exercise demonstration workflow
7. Video render pipeline (FFmpeg/Remotion/MoviePy/Shotstack/Creatomate)
8. Dashboard & workflow management

User choices: Django + DRF + SQLite (scalable to any SQL backend), Django auth (JWT),
Emergent Universal LLM Key (no extra cost POC).

## Architecture
- Backend: Django 5 + DRF, served via Django ASGI by `uvicorn server:app` on :8001
- DB: SQLite by default; `DB_ENGINE` env var swaps to Postgres/MySQL without code change
- Auth: JWT via `djangorestframework-simplejwt` (access 7d / refresh 30d)
- AI: `emergentintegrations` library with Claude Sonnet 4.5 via Emergent Universal Key
- Frontend: React 19 + Tailwind + Shadcn, organic earthy palette (Deep Forest Green, Sage, Sand, Clay)

## Personas
- **Super Admin** — platform owner managing studios, users, master exercise library
- **Studio Owner** — boutique studio operator generating + approving classes
- **Trainer** — (Phase 2) studio member generating drafts for owner approval

## Implemented (Feb 2026)
- Multi-tenant auth: register creates `Studio` + `Owner` atomically; login + me; super-admin role
- Studio branding settings (name, tagline, color, logo URL, voice & avatar preferences)
- Exercise library (system + studio-scoped) with category/difficulty/muscle filters, search, add-exercise dialog
- 25 seeded system exercises spanning pilates/strength/flexibility/balance
- AI class generation (REAL via Emergent LLM Claude Sonnet 4.5):
  - Class structure with intro + segments (minute markers, scripts, breath, safety, motivational lines) + outro
  - Strictly uses approved exercise library
  - Falls back to deterministic template if LLM call fails
- Generation pipeline tracker — script → voice → avatar → render with per-step job rows
- Class detail page: live polling, segment cards, regenerate-segment dialog with custom instruction,
  full-regenerate, approve, MP4 download button (mocked URL)
- Super-admin panel: KPIs + studios + users tables
- Landing page (hero, features bento, workflow, pricing CTA)

## MOCKED in Phase 1 (per user choice — zero-cost POC)
- Voice generation → returns `mock.fitstudio.ai/voice/<id>.mp3`
- Avatar rendering → returns `mock.fitstudio.ai/avatar/<id>.mp4`
- Final MP4 stitch → returns `mock.fitstudio.ai/videos/<id>.mp4`

## Test Credentials
See `/app/memory/test_credentials.md`

## P0 / P1 backlog (Phase 2)
P0
- Integrate ElevenLabs for per-segment voice generation
- Integrate HeyGen (or Tavus/Synthesia/D-ID) for avatar talking clips per segment
- FFmpeg / MoviePy rendering pipeline with intro/outro, branded overlays, exercise demo clips, timers, music + ducking
- Persistent background worker (Celery/RQ) replacing daemon threads
P1
- Studio object storage (Emergent object storage) for uploaded logos and rendered MP4s
- Trainer role + approval workflow (trainer drafts → owner approves)
- Exercise alternative mapping UI for accessibility
- Class templates (recurring weekly classes, duplicate)
- Usage metering + per-studio quotas + billing
P2
- Studio public class catalog (member-facing portal)
- Mobile companion app
- Live class scheduling

## Next Action Items
1. User to provide ElevenLabs + HeyGen API keys to upgrade voice & avatar from MOCKED → real
2. Decide on render pipeline tool (FFmpeg is leanest, Shotstack/Creatomate are hosted)
3. Enable Celery worker once long-running jobs hit ~30+ seconds per class
