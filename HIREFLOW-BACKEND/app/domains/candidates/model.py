from datetime import datetime, timezone

from core.database import Base
from sqlalchemy import ARRAY, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    password: Mapped[str] = mapped_column(String(60))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True)
    resume_url: Mapped[str] = mapped_column(String(500))
    linkedin_url: Mapped[str | None] = mapped_column(
        String(500), default=None, nullable=True
    )
    experience_years: Mapped[float] = mapped_column(default=0.0)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    current_title: Mapped[str] = mapped_column(String(100))
    current_company: Mapped[str] = mapped_column(String(100))
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

    applications: Mapped[list["Application"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan"
    )
