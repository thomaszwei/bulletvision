from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.calibration_profile import CalibrationProfile
from app.schemas.calibration import CalibrationProfileCreate, CalibrationProfileOut

router = APIRouter()


@router.get("", response_model=list[CalibrationProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalibrationProfile).order_by(CalibrationProfile.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=CalibrationProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(body: CalibrationProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = CalibrationProfile(**body.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.put("/{profile_id}/activate", response_model=CalibrationProfileOut)
async def activate_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    # Deactivate all
    result = await db.execute(select(CalibrationProfile))
    for p in result.scalars().all():
        p.is_active = False

    # Activate chosen
    result2 = await db.execute(select(CalibrationProfile).where(CalibrationProfile.id == profile_id))
    profile = result2.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Calibration profile not found")
    profile.is_active = True
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalibrationProfile).where(CalibrationProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Calibration profile not found")
    await db.delete(profile)
    await db.commit()
