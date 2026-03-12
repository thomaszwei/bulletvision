from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # E.g. "first_blood", "sharpshooter", "hat_trick", "bullseye_master"
    achievement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    data_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    player: Mapped["Player"] = relationship("Player", back_populates="achievements")  # noqa: F821
