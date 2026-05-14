# FitStudio AI — Backend (Django + DRF)

Multi-tenant SaaS backend that powers AI-generated fitness class scripts, voiceovers (mocked),
avatar renders (mocked), and final MP4 stitching (mocked).

## Stack

- Python 3.11+
- Django 5 + Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- SQLite by default — drop in Postgres/MySQL by changing `DB_ENGINE` in `.env`
- AI script generation via `emergentintegrations` (Claude Sonnet 4.5 by default)
- ASGI entrypoint compatible with `uvicorn` (`server:app`) or `gunicorn` + `uvicorn` workers

## Project layout

```
backend/
├── server.py                   # ASGI entrypoint: `uvicorn server:app`
├── manage.py
├── requirements.txt
├── fitstudio/                  # Django project
│   ├── settings.py
│   ├── urls.py                 # all routes mounted under /api
│   ├── asgi.py / wsgi.py
├── accounts/                   # custom User, auth, super-admin endpoints
├── studios/                    # tenant model + studio settings
├── exercises/                  # exercise library (system + studio-scoped)
└── classes/                    # FitnessClass + GenerationJob + pipeline
    ├── llm_service.py          # LLM call w/ JSON-only system prompt + fallback
    └── pipeline.py             # daemon-thread orchestrator (script → voice → avatar → render)
```

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

cp .env.example .env                # then fill in EMERGENT_LLM_KEY at minimum

python manage.py migrate
python manage.py seed_data          # super admin + demo studio + 25 system exercises

# Run dev server (ASGI). Hot reload on.
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

API base URL: `http://localhost:8001/api`

## Seeded credentials (dev)

```
Super admin     admin@fitstudio.ai / Admin@12345
Demo owner      owner@lumen.studio / Owner@12345  (studio: Lumen Pilates)
```

## Key endpoints

```
POST /api/auth/register              # creates studio + owner atomically
POST /api/auth/login                 # → {access, refresh, user}
GET  /api/auth/me                    # current user (with nested studio)
PATCH /api/auth/profile              # update first_name/last_name/email
POST /api/auth/password              # change_password

GET  /api/studios/current
PATCH /api/studios/current           # branding (name, color, voice, avatar...)

GET  /api/exercises/                 # ?category=&difficulty=&q=&scope=system|studio
POST /api/exercises/                 # create studio-scoped exercise
GET/PATCH/DELETE /api/exercises/<id>
POST /api/exercises/<id>/approve

GET  /api/classes/                   # studio-scoped list
POST /api/classes/                   # kicks off pipeline in daemon thread
GET/PATCH/DELETE /api/classes/<id>
POST /api/classes/<id>/regenerate-segment
POST /api/classes/<id>/regenerate
POST /api/classes/<id>/approve

# Super-admin only
GET  /api/admin/metrics
GET  /api/admin/studios
GET  /api/admin/studios/<id>         # nested members + classes + exercises
GET  /api/admin/users
```

## Switching databases

The default SQLite DB lives at `backend/fitstudio.sqlite3`. To swap to Postgres:

```dotenv
DB_ENGINE="django.db.backends.postgresql"
DB_NAME_SQL="fitstudio"
DB_USER="fitstudio"
DB_PASSWORD="…"
DB_HOST="localhost"
DB_PORT="5432"
```

Then re-run migrations: `python manage.py migrate`.

## Production deployment

```bash
# collectstatic
python manage.py collectstatic --noinput

# run via gunicorn + uvicorn workers
gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8001 server:app
```

Or any ASGI-aware host (Daphne, Hypercorn, Uvicorn).

## What's MOCKED in this build

The script-generation step uses a **real** LLM call. Voice, avatar, and final MP4 render
return placeholder URLs. To unmock, edit `classes/pipeline.py` and replace the three
`MOCKED` sections with real provider calls (ElevenLabs / HeyGen / FFmpeg).

## Background jobs

Currently the class-generation pipeline runs in a Python `threading.Thread`. For
production, swap with Celery (Redis broker) so jobs survive restarts. The orchestrator
is in `classes/pipeline.py:_run_pipeline` — point a Celery task at the same function.

## Tests

```bash
python manage.py test
# or
pytest backend/tests/
```
