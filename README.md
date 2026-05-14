# FitStudio AI

Multi-tenant SaaS platform that auto-generates guided fitness class videos from a text brief —
AI script + voiceover + avatar instructor + branded MP4 — built for boutique pilates/fitness studios.

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | **Django 5 + DRF**, JWT auth, SQLite (Postgres-ready) |
| Frontend | **React 19** + Tailwind + Shadcn/UI |
| AI       | Claude Sonnet 4.5 via `emergentintegrations` (Emergent Universal Key) |
| Phase 2  | ElevenLabs (voice) · HeyGen/Tavus/Synthesia/D-ID (avatar) · FFmpeg/Remotion (render) |

## Repository layout

```
app/
├── backend/        # Django project (see backend/README.md)
├── frontend/       # React app
├── memory/         # PRD + test credentials
└── README.md
```

## Quick start (local, no Emergent)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

cp .env.example .env                # fill EMERGENT_LLM_KEY at minimum

python manage.py migrate
python manage.py seed_data

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend

```bash
cd frontend
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env
yarn install
yarn start
```

App: `http://localhost:3000`

### Seeded logins

```
Super admin     admin@fitstudio.ai / Admin@12345
Demo owner      owner@lumen.studio / Owner@12345
```

## Features (Phase 1 — current)

1. **Multi-tenant auth** — register creates `Studio` + `Owner` atomically; super-admin role
2. **AI class generation** — text brief → minute-by-minute script with intro/segments/outro
   (real LLM call via Emergent Universal Key, deterministic fallback if LLM offline)
3. **Exercise library** — 25 seeded system exercises + studio-scoped CRUD with detail drawer
4. **Generation job tracker** — script → voice → avatar → render with per-step status
5. **Class management** — list/detail, edit title + music, full regenerate, per-segment regenerate
   with custom instruction, approve, delete, MP4 download
6. **Tabs in class list** — All / In Progress / Ready, with counts
7. **Branding settings** — name, tagline, logo URL, brand color (live theme update), voice + avatar prefs
8. **Avatar Studio** — pick template, pick voice, render sample line (MOCKED)
9. **Profile settings** — edit name/email + change password (works for owner & super admin)
10. **Super admin dashboard** — KPIs, clickable studio drill-down, users table

## What's MOCKED

- Voice generation (ElevenLabs)
- Avatar video render (HeyGen / Synthesia / Tavus / D-ID)
- Final MP4 stitching (FFmpeg)

Each is a clearly-labeled `MOCKED` block in `backend/classes/pipeline.py` and
`frontend/src/pages/AvatarStudio.jsx`. Drop in real provider keys + calls to unmock.

## Production deployment

- **Backend**: any ASGI host (Uvicorn, Daphne, Hypercorn). Use Postgres by setting
  `DB_ENGINE`, `DB_NAME_SQL`, etc. in `backend/.env`. Replace daemon-thread pipeline
  with Celery once jobs grow past ~30s.
- **Frontend**: `yarn build` produces a static bundle ready for Nginx / Vercel / Netlify.
- See `backend/README.md` for full deploy notes.

## Test credentials

See [`memory/test_credentials.md`](memory/test_credentials.md).
