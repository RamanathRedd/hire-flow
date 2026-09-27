from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RecruiterCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    department: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6)


class RecruiterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = Field(default=None)
    phone: str | None = Field(default=None, min_length=10, max_length=15)
    department: str | None = Field(default=None, min_length=3, max_length=100)
    password: str | None = Field(default=None, min_length=6)


class Response(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    department: str
    created_at: datetime


class RecruiterListResponse(BaseModel):
    data: list[Response]
