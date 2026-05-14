# FitStudio AI — PRD

## Original problem statement
Build a scalable AI-powered SaaS for boutique fitness studios that auto-generates guided
class videos from a text brief. Pilot = pilates studio.

## Tech stack
- Backend: Django 5 + DRF, SQLite (Postgres-ready via `DB_ENGINE`)
- Auth: JWT (`djangorestframework-simplejwt`)
- AI: Claude Sonnet 4.5 via `emergentintegrations` (Emergent Universal Key)
- Frontend: React 19 + Tailwind + Shadcn/UI
- Theme: Deep Forest Green / Sage / Sand / Clay; brand color updates whole app live

## Personas
- Super Admin — platform owner
- Studio Owner — boutique studio operator
- Trainer (Phase 2) — studio member, drafts → owner approves

## Implemented (Feb 2026)

### Iteration 1
- Multi-tenant auth (register creates Studio + Owner atomically)
- Studio branding settings, exercise library (25 system + studio scoped CRUD)
- AI class generation (real Emergent LLM script + MOCKED voice/avatar/render)
- Generation pipeline tracker, class detail with segment regenerate
- Super admin dashboard with KPIs + tables

### Iteration 2 (this build) — 7 user-requested fixes/features
1. **Super Admin UX fixed** — auto-redirects to `/app/admin`; clickable studio rows open `/app/admin/studios/:id` with full dossier (members + classes + studio exercises); new endpoint `GET /api/admin/studios/<uuid>`
2. **Live brand theming** — Branding page updates `--primary` CSS variable in real time via hex→HSL conversion; persists across reloads (auth context applies on login/refresh). Color picker + 6 presets included.
3. **Avatar Studio** — `/app/avatar` route with 3 template cards, voice select, sample render (MOCKED ~2s), Save as studio default.
4. **Exercise library upgraded** — cards now clickable → side Sheet with full instructions, safety notes, target muscles; "Why a library?" explainer block added at top.
5. **Classes view/edit/delete + tabs** — `ClassesList` has All / In Progress / Ready tabs (URL-synced) with counts; each card has Open + Delete; `ClassDetail` has Edit dialog (title + music) and Delete with AlertDialog.
6. **Clickable dashboard cards** — 4 KPI cards now Link components going to dedicated filtered pages.
7. **Profile settings** — `/app/profile` for both Owner and Super Admin. Patch name/email + change password (POST `/api/auth/password`).

### Portability
- `/app/README.md` — full local-setup instructions (no Emergent dependencies)
- `/app/backend/README.md` — backend deep dive, endpoint list, DB switch guide, prod deploy notes
- `/app/backend/.env.example` — sample env file with all knobs documented
- All env-driven config (no hardcoded URLs/keys)
- Inline code comments on key modules (`pipeline.py`, `llm_service.py`, `theme.js`, `auth.jsx`)

## Test Credentials
See `/app/memory/test_credentials.md` — unchanged.

## Tests
- Iteration 1: 24/24 pytest passed
- Iteration 2: 13/13 new pytest + all 7 critical UI flows passed
- See `/app/test_reports/iteration_1.json`, `/app/test_reports/iteration_2.json`

## What's still MOCKED
- ElevenLabs voice generation (in `classes/pipeline.py`)
- HeyGen/Synthesia/Tavus/D-ID avatar render (`classes/pipeline.py` + `AvatarStudio.jsx`)
- FFmpeg/Remotion final MP4 stitching (`classes/pipeline.py`)

## P0 backlog (Phase 2)
- ElevenLabs integration (drop in API key → unmock voice step)
- Avatar provider integration (HeyGen recommended)
- FFmpeg/Remotion final-render pipeline (intro/outro, branded overlays, exercise demo splicing, music + ducking)
- Celery worker replacing daemon threads (job durability across restarts)

## P1 backlog
- Trainer role with draft→approve workflow
- Class templates (recurring/duplicate)
- Per-studio quotas + Stripe billing
- Exercise alternative mapping UI (accessibility variations)
- Object storage for uploaded logos & rendered MP4s

## P2 backlog
- Studio public class catalog (member-facing)
- Mobile companion app
- Live class scheduling
