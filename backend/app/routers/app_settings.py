from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.settings import SettingOut, SettingsBulkUpdate
from app.services.settings_service import get_all_settings, update_settings

router = APIRouter()


@router.get("", response_model=dict)
async def read_settings(db: AsyncSession = Depends(get_db)):
    """Returns all settings as {key: deserialized_value} dict."""
    return await get_all_settings(db)


@router.put("")
async def write_settings(body: SettingsBulkUpdate, db: AsyncSession = Depends(get_db)):
    """Update one or more settings. Values must be JSON-encoded strings."""
    await update_settings(db, body.settings)
    await db.commit()
    return await get_all_settings(db)
