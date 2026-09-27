from core.constants import STAGE_LITERAL
from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    job_id: int
    stage: STAGE_LITERAL = Field(default="Applied", max_length=20)
    cover_note: str | None = Field(default=None, min_length=3, max_length=500)
    notes: str | None = Field(default=None, min_length=3, max_length=500)
    rejection_reason: str | None = Field(default=None, min_length=3, max_length=500)


class ApplicationFilters(BaseModel):
    job_id: int | None = None
    stage: STAGE_LITERAL | None = Field(default=None, max_length=20)


class UpdateStage(BaseModel):
    new_stage: STAGE_LITERAL = Field(max_length=20)
    notes: str | None = Field(default=None, min_length=3, max_length=500)


class RejectApplication(BaseModel):
    rejection_reason: str = Field(min_length=3, max_length=500)
    notes: str | None = Field(default=None, min_length=3, max_length=500)

    model_config = {
        "str_strip_whitespace": True  # Auto-trims all strings in this model
    }
