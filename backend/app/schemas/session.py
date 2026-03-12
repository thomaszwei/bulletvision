from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.player import PlayerOut


class SessionPlayerOut(BaseModel):
    id: int
    player_id: int
    player: PlayerOut
    turn_order: int
    score: int
    shots_fired: int
    is_active: bool

    model_config = {"from_attributes": True}


class SessionBase(BaseModel):
    name: str | None = Field(None, max_length=200)
    mode: str = Field(default="freeplay", pattern=r"^(freeplay|turnbased|timed)$")
    notes: str | None = None


class SessionCreate(SessionBase):
    player_ids: list[int] = Field(default_factory=list)


class SessionUpdate(BaseModel):
    name: str | None = None
    notes: str | None = None
    status: str | None = Field(None, pattern=r"^(pending|active|paused|ended)$")


class SessionOut(SessionBase):
    id: int
    status: str
    baseline_path: str | None
    created_at: datetime
    ended_at: datetime | None
    session_players: list[SessionPlayerOut] = []

    model_config = {"from_attributes": True}
