from datetime import datetime, timezone
from typing import List

from core.constants import JOB_TYPE, STATUS
from core.database import Base
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(50))
    department: Mapped[str] = mapped_column(String(50))
    location: Mapped[str] = mapped_column(String(50))
    job_type: Mapped[JOB_TYPE] = mapped_column(String(15))
    description: Mapped[str] = mapped_column(String(500))
    requirements: Mapped[str] = mapped_column(String(1000))
    status: Mapped[STATUS] = mapped_column(String(10), default="Draft")
    created_by: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=lambda: datetime.now(timezone.utc).replace(microsecond=0),
        nullable=True,
        default=None,
    )
    openings_count: Mapped[int]
    filled_count: Mapped[int] = mapped_column(default=0)

    recruiter: Mapped["Recruiter"] = relationship(back_populates="jobs")
    applications: Mapped[List["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
