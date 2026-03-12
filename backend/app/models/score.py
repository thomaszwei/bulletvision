from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    player_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True
    )
    detection_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    # bullseye | inner | middle | outer | none
    zone: Mapped[str | None] = mapped_column(String(20), nullable=True, default="none")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="scores")  # noqa: F821
    player: Mapped["Player"] = relationship("Player", back_populates="scores")  # noqa: F821
    detection: Mapped["Detection | None"] = relationship("Detection", back_populates="score")  # noqa: F821
