import logging

from core.config import settings
from core.database import init_db
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from domains.anlaytics.router import analytics_router
from domains.application_stage_history import model as stage_history_model  # noqa: F401
from domains.applications import model as application_model  # noqa: F401
from domains.applications.router import applications_router
from domains.candidates import model as candidate_model  # noqa: F401
from domains.candidates.router import candidates_router
from domains.reference_data.router import reference_data_router
from domains.interviews import model as interview_model  # noqa: F401
from domains.interviews.router import interviews_router
from domains.jobs import model as job_model  # noqa: F401
from domains.jobs.router import jobs_router
from domains.recruiters import model as recruiter_model  # noqa: F401
from domains.recruiters.router import recruiters_router
from domains.auth.router import auth_router
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("hireflow.api")
app = FastAPI(title=settings.APP_TITLE)


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    _request: Request, error: RequestValidationError
) -> JSONResponse:
    details = [
        {
            "loc": detail.get("loc", ()),
            "msg": detail.get("msg", "Invalid value"),
            "type": detail.get("type", "value_error"),
        }
        for detail in error.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": details},
    )


async def handle_unexpected_error(
    request: Request, call_next
) -> JSONResponse:
    try:
        return await call_next(request)
    except Exception as error:
        logger.error(
            "Unhandled API error for %s %s",
            request.method,
            request.url.path,
            exc_info=(type(error), error, error.__traceback__),
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred. Please try again later."
            },
        )


app.middleware("http")(handle_unexpected_error)


@app.get("/health")
def health():
    return {"status": "ok"}


# Keep CORS outside the error middleware so even unexpected errors carry CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
app.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
app.include_router(
    reference_data_router, prefix="/reference_data", tags=["reference_data"]
)
app.include_router(applications_router, prefix="/applications", tags=["applications"])
app.include_router(recruiters_router, prefix="/recruiters", tags=["recruiters"])
app.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
