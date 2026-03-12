"""
Settings service — read/write app settings from the DB.
Seeds default values on first run.
"""
from __future__ import annotations

import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.setting import Setting

logger = logging.getLogger(__name__)


DEFAULTS: dict[str, object] = {
    "detection_min_area": 25.0,
    "detection_max_area": 1500.0,
    "detection_circularity": 0.35,
    "detection_darkness_threshold": 120,
    "detection_confidence_threshold": 0.55,
    "detection_alignment_enabled": False,
    "detection_fps": 3,
    "points_per_hole": 10,
    "zone_scoring_enabled": False,
    "camera_width": 640,
    "camera_height": 480,
}


async def seed_default_settings() -> None:
    async with AsyncSessionLocal() as db:
        for key, value in DEFAULTS.items():
            result = await db.execute(select(Setting).where(Setting.key == key))
            if not result.scalar_one_or_none():
                db.add(Setting(key=key, value=json.dumps(value)))
        await db.commit()
    logger.info("Default settings seeded.")


async def get_all_settings(db: AsyncSession) -> dict[str, object]:
    result = await db.execute(select(Setting))
    rows = result.scalars().all()
    return {row.key: json.loads(row.value) for row in rows}


async def update_settings(db: AsyncSession, updates: dict[str, str]) -> None:
    for key, json_value in updates.items():
        # Validate JSON
        json.loads(json_value)  # raises ValueError if invalid
        result = await db.execute(select(Setting).where(Setting.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = json_value
        else:
            db.add(Setting(key=key, value=json_value))
    await db.flush()
