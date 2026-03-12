from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class SettingOut(BaseModel):
    key: str
    value: str  # JSON-encoded
    updated_at: datetime

    model_config = {"from_attributes": True}


class SettingsBulkUpdate(BaseModel):
    """Map of setting key → JSON-encoded value string."""
    settings: dict[str, str]
