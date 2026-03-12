from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, Float, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    player_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("players.id", ondelete="SET NULL"), nullable=True
    )
    # Normalised coordinates — (0.0 – 1.0) relative to frame width/height
    # so the overlay works at any display resolution.
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    radius: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    # pending | confirmed | rejected
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    frame_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    annotated_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="detections")  # noqa: F821
    player: Mapped["Player | None"] = relationship("Player", back_populates="detections")  # noqa: F821
    score: Mapped["Score | None"] = relationship("Score", back_populates="detection", uselist=False)  # noqa: F821
