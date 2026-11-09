# FitStudio AI

A multi-tenant fitness-studio platform for turning a class brief into a guided class workflow: AI-assisted script generation, class management, studio branding, and generation-job tracking. Voice, avatar, and final video-render steps are currently mocked; see [What is implemented](#implemented-and-mocked) before expecting an MP4 pipeline.

## Project structure

```text
.
├── backend/       # Django/DRF API and ASGI entry point
├── frontend/      # React application
├── memory/        # project notes
├── tests/         # project test assets
└── README.md
```

## Stack

- Backend: Django, Django REST Framework, JWT authentication, SQLite by default
- Frontend: React 19, Tailwind CSS, and Radix-based UI components
- AI script generation: `emergentintegrations` (provider configuration required)
- Planned integrations: voice generation, avatar rendering, and video assembly

## Local development

### Backend

The backend imports Django and Django REST Framework, but the current `backend/requirements.txt` does not list those packages. Fix/synchronize the dependency manifest before following the backend install steps; otherwise a fresh environment will not start. Do not commit local `.env` files or API keys.

After the dependency manifest is corrected:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

# Configure required environment values locally, then:
python manage.py migrate
python manage.py seed_data
uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

### Frontend

In another terminal:

```bash
cd frontend
yarn install
```

Set `REACT_APP_BACKEND_URL=http://127.0.0.1:8001` in a local `frontend/.env`, then run:

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000). The frontend package also defines `yarn build` and `yarn test`.

## Implemented and mocked

The current app includes tenant-aware registration and authentication, class and exercise management, a generation-job tracker, branding/profile settings, and a super-admin dashboard. The script-generation integration is described in the backend code; voice generation, avatar rendering, and final video stitching are explicitly mocked and must not be treated as production integrations.

## Tests

Once the backend dependencies are available, run the Django tests from `backend/`:

```bash
python manage.py test
```

Frontend test command:

```bash
cd frontend
yarn test
```

## Security and deployment

Use development credentials only for local testing, rotate any credentials that may have been exposed, and configure unique production secrets outside the repository. Review the backend's database and job-processing choices before deployment; the current pipeline uses in-process background work and is not a durable job queue.
