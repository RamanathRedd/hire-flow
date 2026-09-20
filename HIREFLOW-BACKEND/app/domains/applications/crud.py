from datetime import datetime, timezone

from core.constants import STAGES
from core.exceptions import (
    ApplicationAlreadyExistsError,
    ApplicationAlreadyHiredError,
    ApplicationAlreadyRejectedError,
    ApplicationNotExistsError,
    BackwardStageError,
    CandidateNotExistsError,
    DuplicateStageError,
    JobNotExistsError,
    JobNotOpenError,
    RecruiterNotExistsError,
    SkippedStageError,
    UnauthorizedError,
)
from domains.application_stage_history.model import StageHistory
from domains.applications.model import Application
from domains.applications.schemas import (
    ApplicationCreate,
    ApplicationFilters,
    RejectApplication,
    UpdateStage,
)
from domains.candidates.model import Candidate
from domains.jobs.model import Job
from domains.recruiters.model import Recruiter
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload


def _serialize_model(instance) -> dict:
    return {
        column.name: getattr(instance, column.name)
        for column in instance.__table__.columns
    }


def create_application(
    db: Session, application: ApplicationCreate, current_user: dict
) -> None:
    if current_user["role"] != "User":
        raise UnauthorizedError

    job_exists = db.scalar(select(Job).where(Job.id == application.job_id))

    if not job_exists:
        raise JobNotExistsError

    if job_exists.status != "Open":
        raise JobNotOpenError

    candidate_exists = db.scalar(
        select(Candidate).where(Candidate.id == current_user["id"])
    )

    if not candidate_exists:
        raise CandidateNotExistsError

    query = select(Application).where(
        Application.job_id == application.job_id,
        Application.candidate_id == current_user["id"],
    )
    application_exist = db.scalar(query)

    if application_exist:
        raise ApplicationAlreadyExistsError

    db_application = Application(
        **application.model_dump(), candidate_id=current_user["id"]
    )

    db.add(db_application)
    db.flush()

    history_entry = StageHistory(
        application_id=db_application.id,
        from_stage=None,
        to_stage=application.stage,
        notes=application.notes or None,
    )

    db.add(history_entry)
    db.commit()


def get_applications(
    db: Session, application_filters: ApplicationFilters, current_user: dict
) -> list[Application]:
    if current_user["role"] != "User":
        raise UnauthorizedError

    query = select(Application)

    if application_filters.job_id:
        query = query.where(Application.job_id == application_filters.job_id)

    if application_filters.stage:
        query = query.where(Application.stage == application_filters.stage)

    query = query.where(Application.candidate_id == current_user["id"])

    return db.scalars(query).all()


def get_application_details(
    db: Session, application_id: int, current_user: dict
) -> dict | None:
    if current_user["role"] != "User":
        raise UnauthorizedError

    application = db.scalar(select(Application).where(Application.id == application_id))

    if not application:
        raise ApplicationNotExistsError

    interviews_completed = interviews_pending = 0
    interviews = sorted(application.interviews, key=lambda h: h.scheduled_at)

    for interview in interviews:
        if interview.status == "Completed":
            interviews_completed += 1
        elif interview.status in ("Scheduled", "Rescheduled"):
            interviews_pending += 1

    history_data = []
    now_utc = datetime.now(timezone.utc).replace(microsecond=0)
    for stage_history in application.stage_histories:
        history_data.append(
            {
                "id": stage_history.id,
                "from_stage": stage_history.from_stage,
                "to_stage": stage_history.to_stage,
                "created_at": stage_history.created_at,
                "changed_by": stage_history.recruiter.name
                if getattr(stage_history, "recruiter", None)
                else None,
                "notes": stage_history.notes,
            }
        )

    if application.stage in ("Hired", "Rejected"):
        total_days_in_process = (
            application.stage_updated_at - application.applied_at
        ).days
    else:
        total_days_in_process = (now_utc - application.applied_at).days

    response = {
        "application": _serialize_model(application),
        "candidate": application.candidate,
        "job": application.job,
        "stage_history": application.stage_histories,
        "interviews": interviews,
        "summary": {
            "total_days_in_process": total_days_in_process,
            "current_stage_days": (now_utc - application.stage_updated_at).days
            if application.stage_updated_at
            else None,
            "total_stages_passed": len(application.stage_histories),
            "interviews_completed": interviews_completed,
            "interviews_pending": interviews_pending,
        },
    }

    return response


def update_application_stage(
    db: Session, application_id: int, update_stage: UpdateStage, current_user: dict
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    recruiter_exist = db.scalar(
        select(Recruiter).where(Recruiter.id == current_user["id"])
    )

    if not recruiter_exist:
        raise RecruiterNotExistsError

    application = db.scalar(select(Application).where(Application.id == application_id))

    if not application:
        raise ApplicationNotExistsError

    if application.stage == "Rejected":
        raise ApplicationAlreadyRejectedError

    if application.stage == "Hired":
        raise ApplicationAlreadyHiredError

    if application.stage == update_stage.new_stage:
        raise DuplicateStageError

    current_position = STAGES.index(application.stage)
    new_position = STAGES.index(update_stage.new_stage)
    if new_position < current_position:
        raise BackwardStageError

    if new_position > current_position + 1:
        raise SkippedStageError(STAGES[current_position + 1])

    previous_stage = application.stage
    application.stage = update_stage.new_stage
    application.stage_updated_at = datetime.now(timezone.utc).replace(microsecond=0)
    if update_stage.notes:
        application.notes = update_stage.notes

    history_entry = StageHistory(
        application_id=application_id,
        from_stage=previous_stage,
        to_stage=update_stage.new_stage,
        changed_by=current_user["id"],
        notes=update_stage.notes or None,
    )

    db.add(history_entry)

    if update_stage.new_stage == "Hired":
        job = db.scalar(select(Job).where(Job.id == application.job_id))
        if job:
            job.filled_count += 1
            if job.filled_count >= job.openings_count:
                job.status = "Closed"

    db.commit()


def reject_application(
    db: Session,
    application_id: int,
    update_stage: RejectApplication,
    current_user: dict,
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    recruiter_exists = db.scalar(
        select(Recruiter).where(Recruiter.id == current_user["id"])
    )

    if not recruiter_exists:
        raise RecruiterNotExistsError

    application = db.scalar(select(Application).where(Application.id == application_id))

    if not application:
        raise ApplicationNotExistsError

    if application.stage == "Rejected":
        raise ApplicationAlreadyRejectedError

    if application.stage == "Hired":
        raise ApplicationAlreadyHiredError

    previous_stage = application.stage
    application.stage = "Rejected"
    application.stage_updated_at = datetime.now(timezone.utc).replace(microsecond=0)
    application.rejection_reason = update_stage.rejection_reason
    if update_stage.notes:
        application.notes = update_stage.notes

    history_entry = StageHistory(
        application_id=application_id,
        from_stage=previous_stage,
        to_stage="Rejected",
        changed_by=current_user["id"],
        notes=update_stage.notes or None,
    )

    db.add(history_entry)
    db.commit()


def get_application_timeline(
    db: Session, application_id: int, current_user: dict
) -> dict | None:
    if current_user["role"] != "User":
        raise UnauthorizedError

    application = db.scalar(
        select(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .where(Application.id == application_id)
    )
    if not application:
        raise ApplicationNotExistsError

    stage_histories = list(
        db.scalars(
            select(StageHistory)
            .where(StageHistory.application_id == application_id)
            .order_by(StageHistory.created_at.asc())
        ).all()
    )

    recruiter_ids = {
        stage_history.changed_by
        for stage_history in stage_histories
        if stage_history.changed_by
    }
    recruiter_map = {}
    if recruiter_ids:
        recruiter_map = dict(
            db.execute(
                select(Recruiter.id, Recruiter.name).where(
                    Recruiter.id.in_(recruiter_ids)
                )
            ).all()
        )

    timeline = []
    stage_summary = {
        "Applied": "not reached",
        "Screened": "not reached",
        "Interview_R1": "not reached",
        "Interview_R2": "not reached",
        "HR_Round": "not reached",
        "Offer": "not reached",
        "Hired": "not reached",
        "Rejected": "not reached",
    }

    rejection_details = None
    if application.stage in ("Hired", "Rejected"):
        total_days_in_process = (
            application.stage_updated_at - application.applied_at
        ).days
    else:
        total_days_in_process = (
            datetime.now(timezone.utc).replace(microsecond=0) - application.applied_at
        ).days
    response = {
        "application_id": application.id,
        "candidate_name": application.candidate.name,
        "job_title": application.job.title,
        "current_stage": application.stage,
        "applied_at": application.applied_at,
        "total_days_in_process": max(0, total_days_in_process),
        "timeline": timeline,
        "stage_summary": stage_summary,
    }

    for index, stage_history in enumerate(stage_histories):
        recruiter_name = (
            recruiter_map.get(stage_history.changed_by)
            if stage_history.changed_by
            else None
        )

        if index < len(stage_histories) - 1:
            end_time = stage_histories[index + 1].created_at
            status = "Completed"
        else:
            end_time = datetime.now(timezone.utc).replace(microsecond=0)
            status = "ongoing"

        if stage_history.to_stage == "Rejected":
            status = "terminal"
            rejection_details = {
                "rejected_from_stage": stage_history.from_stage,
                "rejection_reason": application.rejection_reason,
                "rejected_at": stage_history.created_at,
                "rejected_by": recruiter_name,
            }

        diff = end_time - stage_history.created_at
        total_seconds = int(diff.total_seconds())
        days = diff.days
        hours = (total_seconds // 3600) % 24

        display_time = f"{days} days, {hours} hours" if days > 0 else f"{hours} hours"

        if len(stage_histories) == 1:
            display_time += " ongoing"

        if stage_history.to_stage == "Rejected":
            display_time = "closed"

        timeline.append(
            {
                "position": index + 1,
                "from_stage": stage_history.from_stage,
                "to_stage": stage_history.to_stage,
                "changed_at": stage_history.created_at,
                "changed_by": recruiter_name,
                "notes": stage_history.notes,
                "time_spent": {
                    "display": display_time,
                    "status": status,
                },
            }
        )

        stage_summary[stage_history.to_stage] = (
            "terminal" if stage_history.to_stage == "Rejected" else display_time
        )

    if rejection_details:
        response["rejection_details"] = rejection_details

    return response
