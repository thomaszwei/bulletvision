from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class ScoreOut(BaseModel):
    id: int
    session_id: int
    player_id: int
    detection_id: int | None
    points: int
    zone: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HighscoreEntry(BaseModel):
    rank: int
    player_id: int
    player_name: str
    avatar_color: str
    total_score: int
    sessions_played: int
    accuracy: float
    best_session_score: int | None
