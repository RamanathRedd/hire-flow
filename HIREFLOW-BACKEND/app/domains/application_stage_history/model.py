from datetime import datetime, timezone

from core.constants import STAGE_LITERAL
from core.database import Base
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class StageHistory(Base):
    __tablename__ = "stage_histories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE")
    )
    from_stage: Mapped[STAGE_LITERAL | None] = mapped_column(
        String(20), nullable=True, default=None
    )
    to_stage: Mapped[STAGE_LITERAL] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
    )
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True, default=None
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)

    application: Mapped["Application"] = relationship(back_populates="stage_histories")
    recruiter: Mapped["Recruiter"] = relationship(back_populates="stage_histories")
