from core.constants import JOB_TYPE, LOCATIONS_LITERAL, STAGE_LITERAL, STATUS
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=5, max_length=50)
    department: str = Field(min_length=3, max_length=50)
    location: LOCATIONS_LITERAL
    job_type: JOB_TYPE
    description: str = Field(min_length=5, max_length=500)
    requirements: str = Field(min_length=5, max_length=1000)
    status: STATUS = Field(default="Draft")
    openings_count: int = Field(gt=0)
    filled_count: int = Field(default=0)


class JobFilters(BaseModel):
    department: str | None = Field(default=None, min_length=3, max_length=50)
    status: STATUS | None = None
    location: LOCATIONS_LITERAL | None = None


class JobUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=3, max_length=500)
    location: LOCATIONS_LITERAL | None = None
    openings_count: int | None = Field(default=None, gt=0)
    job_type: JOB_TYPE | None = None
    requirements: str | None = Field(default=None, min_length=5, max_length=1000)


class JobApplicationFilters(BaseModel):
    this_week: bool = Field(default=False)
    needs_attention: bool = Field(default=False)
    interview_round: bool = Field(default=False)
    offer_stage: bool = Field(default=False)
    stage_filter: STAGE_LITERAL | None = None
    date_applied_filter: int | None = None
