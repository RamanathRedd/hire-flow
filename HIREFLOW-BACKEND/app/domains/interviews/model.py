from datetime import datetime, timezone

from core.constants import INTERVIEW_STATUS, ROUND_TYPE
from core.database import Base
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE")
    )
    round_number: Mapped[int]
    round_type: Mapped[ROUND_TYPE] = mapped_column(String(20))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE")
    )
    status: Mapped[INTERVIEW_STATUS] = mapped_column(String(15), default="Scheduled")
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    rating: Mapped[int | None] = mapped_column(nullable=True, default=None)
    cancellation_reason: Mapped[Text] = mapped_column(Text, nullable=True, default=None)
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

    recruiter: Mapped["Recruiter"] = relationship(back_populates="interviews")
    application: Mapped["Application"] = relationship(back_populates="interviews")
