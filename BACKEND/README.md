# HireFlow

HireFlow is a FastAPI backend for a recruiting workflow. It provides APIs for recruiter accounts, jobs, candidates, applications, and interviews, with JWT-based authentication and PostgreSQL persistence.

## Features

- Recruiter registration, login, and password updates
- Job creation, search, status updates, and recruiter application views
- Candidate search and profile updates
- Application stage changes, rejection, and timelines
- Interview scheduling, cancellation, and feedback
- SQLAlchemy models and Alembic migration scripts

Analytics routes are registered, but their current handlers are placeholders and do not yet return analytics data.

## Requirements

- Python 3.10 or later
- PostgreSQL

## Setup

From the repository root, install the backend dependencies:

```powershell
cd BACKEND
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic PyJWT "pwdlib[argon2]" python-multipart python-dotenv
Copy-Item .env.example .env
```

Edit `.env` with your PostgreSQL connection string and a long, random `SECRET_KEY`. `APP_TITLE` is optional and defaults to `HireFlow Application`. Keep `.env` private; it is excluded from Git. The database tables are created when the application starts.

## Run

The application imports modules relative to the `app` directory, so start Uvicorn from there:

```powershell
cd app
python -m uvicorn main:app --reload
```

The API is available at <http://127.0.0.1:8000>. Interactive API documentation is at <http://127.0.0.1:8000/docs>; the OpenAPI schema is at <http://127.0.0.1:8000/openapi.json>.

## API Areas

| Prefix | Purpose |
| --- | --- |
| `/auth` | Register, log in, get the current user, and update a password |
| `/jobs` | Manage and search jobs |
| `/candidates` | Search and manage candidate profiles |
| `/applications` | Create applications, manage stages, reject applications, and view timelines |
| `/recruiters` | View and manage recruiter profiles |
| `/interviews` | Schedule interviews and manage interview details and feedback |
| `/analytics` | Planned analytics endpoints; handlers are not implemented yet |

Most protected endpoints require an access token. Log in at `POST /auth/login` using form fields `username` and `password`, then send the returned token as `Authorization: Bearer <token>`.

## Project Layout

```text
BACKEND/
  app/
    core/        Configuration, database, security, and shared exceptions
    domains/     API routers, schemas, services, and models by domain
    alembic/     Database migration environment and revisions
    main.py      FastAPI application and router registration
```

For frontend setup, see [the frontend README](../FRONTEND/README.md).
