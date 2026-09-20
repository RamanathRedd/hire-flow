from datetime import datetime, timezone
from typing import List

from core.database import Base
from domains.interviews.model import Interview
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Recruiter(Base):
    __tablename__ = "recruiters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True)
    department: Mapped[str] = mapped_column(String(100))
    password: Mapped[str] = mapped_column(String(100))
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

    jobs: Mapped[List["Job"]] = relationship(
        back_populates="recruiter", cascade="all, delete-orphan"
    )
    stage_histories: Mapped[List["StageHistory"]] = relationship(
        back_populates="recruiter", passive_deletes=True
    )
    interviews: Mapped[List[Interview]] = relationship(
        back_populates="recruiter", passive_deletes=True
    )
