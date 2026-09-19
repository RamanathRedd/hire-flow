from datetime import datetime, timezone
from sqlalchemy import DateTime, String
from core.constants import ROLE
from core.database import Base
from sqlalchemy.orm import mapped_column, Mapped


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int]
    role: Mapped[ROLE] = mapped_column(String(5))
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
