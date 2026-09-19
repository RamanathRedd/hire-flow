from datetime import datetime

from core.constants import INTERVIEW_STATUS, ROUND_TYPE
from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    application_id: int
    round_number: int = Field(gt=0, lt=6)
    round_type: ROUND_TYPE = Field(min_length=2, max_length=20)
    scheduled_at: datetime
    interviewer_name: str = Field(min_length=3, max_length=100)
    interviewer_id: int | None = None
    status: INTERVIEW_STATUS = Field(default="Scheduled", min_length=8, max_length=15)
    feedback: str | None = Field(default=None, min_length=3)
    rating: int | None = Field(default=None, gt=-1, lt=6)


class InterviewFilters(BaseModel):
    application_id: int | None = None
    status: INTERVIEW_STATUS | None = Field(default=None, min_length=8, max_length=15)
    round_type: ROUND_TYPE | None = Field(default=None, min_length=2, max_length=20)


class UpdateInterview(BaseModel):
    round_type: ROUND_TYPE | None = Field(default=None, min_length=2, max_length=20)
    interviewer_name: str = Field(min_length=3, max_length=100)
    interviewer_id: int | None = None
    scheduled_at: datetime | None = None


class CancelInterview(BaseModel):
    cancellation_reason: str | None = Field(default=None, min_length=2)
    interviewer_name: str = Field(min_length=3, max_length=100)
    interviewer_id: int | None = None


class SubmitFeedback(BaseModel):
    feedback: str = Field(min_length=3)
    rating: int = Field(gt=0, lt=6)
    interviewer_name: str = Field(min_length=3, max_length=100)
    interviewer_id: int | None = None
