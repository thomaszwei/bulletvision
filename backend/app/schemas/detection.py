from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


class DetectionOut(BaseModel):
    id: int
    session_id: int
    player_id: int | None
    x: float
    y: float
    radius: float
    confidence: float
    status: str
    frame_path: str | None
    annotated_path: str | None
    detected_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DetectionAdjust(BaseModel):
    """Operator manually repositions a detection marker."""
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    radius: float = Field(..., gt=0.0, le=1.0)
