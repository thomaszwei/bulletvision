from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


class CalibrationProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    corners_json: str | None = None
    perspective_matrix: str | None = None
    crop_rect_json: str | None = None


class CalibrationProfileOut(BaseModel):
    id: int
    name: str
    corners_json: str | None
    perspective_matrix: str | None
    crop_rect_json: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
