from core.constants import JOB_TYPE, STATUS
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=5, max_length=50)
    department: str = Field(min_length=3, max_length=50)
    location: str = Field(min_length=3, max_length=50)
    job_type: JOB_TYPE
    description: str = Field(min_length=5, max_length=500)
    requirements: str = Field(min_length=5, max_length=1000)
    status: STATUS = Field(default="Draft")
    created_by: int  # recruiter id
    openings_count: int = Field(gt=0)  # no.of openings
    filled_count: int = Field(default=0)  # no.of peoples selected


class JobFilters(BaseModel):
    department: str | None = Field(default=None, min_length=3, max_length=50)
    status: STATUS | None = None
    location: str | None = Field(default=None, min_length=3, max_length=50)


class JobUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=3, max_length=500)
    location: str | None = Field(default=None, min_length=3, max_length=50)
    openings_count: int | None = Field(default=None, gt=0)
    job_type: JOB_TYPE | None = None
    requirements: str | None = Field(default=None, min_length=5, max_length=1000)
