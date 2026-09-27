from datetime import datetime, timezone
from typing import List

from core.constants import STAGE_LITERAL
from core.database import Base
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE")
    )
    stage: Mapped[STAGE_LITERAL] = mapped_column(String(20), default="Applied")
    stage_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
    )
    cover_note: Mapped[str | None] = mapped_column(
        String(500), default=None, nullable=True
    )
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    rejection_reason: Mapped[str | None] = mapped_column(
        String(500), nullable=True, default=None
    )

    job: Mapped["Job"] = relationship(back_populates="applications")
    candidate: Mapped["Candidate"] = relationship(back_populates="applications")
    stage_histories: Mapped[List["StageHistory"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    interviews: Mapped[List["Interview"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
