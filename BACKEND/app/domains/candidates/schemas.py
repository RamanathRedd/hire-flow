from pydantic import BaseModel, EmailStr, Field, HttpUrl


class CandidateCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    resume_url: HttpUrl
    linkedin_url: HttpUrl | None = None
    experience_years: float = Field(ge=0)
    skills: list[str] = Field(default_factory=list)
    current_title: str = Field(min_length=1, max_length=100)
    current_company: str = Field(min_length=1, max_length=100)


class CandidateFilters(BaseModel):
    skills: str | None = None
    min_experience: float | None = Field(default=None, ge=0)
    max_experience: float | None = Field(default=None, ge=0)


class CandidateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=10, max_length=15)
    resume_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None
    experience_years: float | None = Field(default=None, ge=0)
    skills: list[str] | None = None
    current_title: str | None = Field(default=None, min_length=1, max_length=100)
    current_company: str | None = Field(default=None, min_length=1, max_length=100)
