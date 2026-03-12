from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    detection_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    session: Mapped["Session | None"] = relationship("Session", back_populates="snapshots")  # noqa: F821
