from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # pending | active | paused | ended
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    # freeplay | turnbased | timed
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="freeplay")
    baseline_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON blob for per-session overrides of global settings
    settings_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    session_players: Mapped[list["SessionPlayer"]] = relationship(  # noqa: F821
        "SessionPlayer", back_populates="session", cascade="all, delete-orphan",
        order_by="SessionPlayer.turn_order"
    )
    detections: Mapped[list["Detection"]] = relationship(  # noqa: F821
        "Detection", back_populates="session", cascade="all, delete-orphan"
    )
    scores: Mapped[list["Score"]] = relationship(  # noqa: F821
        "Score", back_populates="session", cascade="all, delete-orphan"
    )
    snapshots: Mapped[list["Snapshot"]] = relationship(  # noqa: F821
        "Snapshot", back_populates="session", cascade="all, delete-orphan"
    )
