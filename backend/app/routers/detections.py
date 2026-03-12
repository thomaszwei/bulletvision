from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.detection import Detection
from app.schemas.detection import DetectionOut, DetectionAdjust

router = APIRouter()


async def _get_detection_or_404(detection_id: int, db: AsyncSession) -> Detection:
    result = await db.execute(select(Detection).where(Detection.id == detection_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Detection not found")
    return d


@router.get("/{detection_id}", response_model=DetectionOut)
async def get_detection(detection_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_detection_or_404(detection_id, db)


@router.put("/{detection_id}/confirm", response_model=DetectionOut)
async def confirm_detection(detection_id: int, db: AsyncSession = Depends(get_db)):
    d = await _get_detection_or_404(detection_id, db)
    if d.status == "confirmed":
        return d
    if d.status == "rejected":
        raise HTTPException(400, "Cannot confirm a rejected detection")

    d.status = "confirmed"
    await db.flush()

    # Award points via scoring service
    from app.services.scoring_service import award_points_for_detection
    await award_points_for_detection(db, d)
    await db.commit()

    # Track in memory suppression list
    from app.services.detection_service import add_confirmed_circle
    from app.config import settings
    px = d.x * settings.camera_width
    py = d.y * settings.camera_height
    pr = d.radius * min(settings.camera_width, settings.camera_height)
    add_confirmed_circle(d.session_id, px, py, pr)

    # Broadcast update
    from app.ws.manager import ws_manager
    from app.ws.events import build_detection_updated_event
    await ws_manager.broadcast_to_session(d.session_id, build_detection_updated_event(d))

    await db.refresh(d)
    return d


@router.put("/{detection_id}/reject", response_model=DetectionOut)
async def reject_detection(detection_id: int, db: AsyncSession = Depends(get_db)):
    d = await _get_detection_or_404(detection_id, db)
    if d.status == "rejected":
        return d

    d.status = "rejected"
    await db.commit()

    # Remove from in-memory suppression so the spot can be re-detected if needed
    from app.services.detection_service import remove_confirmed_circle
    from app.config import settings
    px = d.x * settings.camera_width
    py = d.y * settings.camera_height
    remove_confirmed_circle(d.session_id, px, py)

    from app.ws.manager import ws_manager
    from app.ws.events import build_detection_updated_event
    await ws_manager.broadcast_to_session(d.session_id, build_detection_updated_event(d))

    await db.refresh(d)
    return d


@router.put("/{detection_id}/adjust", response_model=DetectionOut)
async def adjust_detection(
    detection_id: int, body: DetectionAdjust, db: AsyncSession = Depends(get_db)
):
    """Operator manually repositions the detection marker."""
    d = await _get_detection_or_404(detection_id, db)
    d.x = body.x
    d.y = body.y
    d.radius = body.radius
    await db.commit()
    await db.refresh(d)
    return d
