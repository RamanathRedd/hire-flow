from core.config import settings
from core.database import init_db
from domains.anlaytics.router import analytics_router
from domains.application_stage_history import model as stage_history_model  # noqa: F401
from domains.applications import model as application_model  # noqa: F401
from domains.applications.router import applications_router
from domains.candidates import model as candidate_model  # noqa: F401
from domains.candidates.router import candidates_router
from domains.interviews import model as interview_model  # noqa: F401
from domains.interviews.router import interviews_router
from domains.jobs import model as job_model  # noqa: F401
from domains.jobs.router import jobs_router
from domains.recruiters import model as recruiter_model  # noqa: F401
from domains.recruiters.router import recruiters_router
from domains.auth.router import auth_router
from fastapi import FastAPI

app = FastAPI(title=settings.APP_TITLE)


init_db()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
app.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
app.include_router(applications_router, prefix="/applications", tags=["applications"])
app.include_router(recruiters_router, prefix="/recruiters", tags=["recruiters"])
app.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
