from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    session_players: Mapped[list["SessionPlayer"]] = relationship(  # noqa: F821
        "SessionPlayer", back_populates="player", cascade="all, delete-orphan"
    )
    detections: Mapped[list["Detection"]] = relationship(  # noqa: F821
        "Detection", back_populates="player"
    )
    scores: Mapped[list["Score"]] = relationship(  # noqa: F821
        "Score", back_populates="player"
    )
    achievements: Mapped[list["Achievement"]] = relationship(  # noqa: F821
        "Achievement", back_populates="player", cascade="all, delete-orphan"
    )
