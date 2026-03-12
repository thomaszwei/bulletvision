from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    avatar_color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    avatar_color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class PlayerOut(PlayerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlayerStats(BaseModel):
    player_id: int
    player_name: str
    total_score: int
    sessions_played: int
    shots_fired: int
    shots_confirmed: int
    accuracy: float  # 0.0 – 1.0
    best_session_score: int | None
