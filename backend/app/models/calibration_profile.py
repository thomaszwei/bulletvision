from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Text, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CalibrationProfile(Base):
    __tablename__ = "calibration_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # JSON list of 4 corner points: [[x,y], [x,y], [x,y], [x,y]]
    corners_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Base64-encoded serialised numpy float32 3×3 matrix
    perspective_matrix: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON {x, y, w, h} crop rectangle in source pixel coordinates
    crop_rect_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
