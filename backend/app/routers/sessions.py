from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.session import Session
from app.models.session_player import SessionPlayer
from app.models.player import Player
from app.models.detection import Detection
from app.schemas.session import SessionCreate, SessionUpdate, SessionOut
from app.schemas.detection import DetectionOut
from app.services import session_service

router = APIRouter()


async def _get_session_or_404(session_id: int, db: AsyncSession) -> Session:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.session_players).selectinload(SessionPlayer.player)
        )
        .where(Session.id == session_id)
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.get("", response_model=list[SessionOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.session_players).selectinload(SessionPlayer.player))
        .order_by(Session.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = Session(name=body.name, mode=body.mode, notes=body.notes)
    db.add(session)
    await db.flush()  # get session.id

    for order, player_id in enumerate(body.player_ids):
        result = await db.execute(select(Player).where(Player.id == player_id))
        if not result.scalar_one_or_none():
            raise HTTPException(400, f"Player {player_id} not found")
        sp = SessionPlayer(
            session_id=session.id,
            player_id=player_id,
            turn_order=order,
            is_active=(order == 0),
        )
        db.add(sp)

    await db.commit()
    return await _get_session_or_404(session.id, db)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_session_or_404(session_id, db)


@router.put("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: int, body: SessionUpdate, db: AsyncSession = Depends(get_db)
):
    s = await _get_session_or_404(session_id, db)
    if body.name is not None:
        s.name = body.name
    if body.notes is not None:
        s.notes = body.notes
    if body.status is not None:
        s.status = body.status
    await db.commit()
    return await _get_session_or_404(session_id, db)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    await db.delete(s)
    await db.commit()


# ── Session state machine ────────────────────────────────────────────────────

@router.post("/{session_id}/start", response_model=SessionOut)
async def start_session(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    await session_service.start_session(db, s)
    await db.commit()
    return await _get_session_or_404(session_id, db)


@router.post("/{session_id}/baseline", response_model=dict)
async def capture_baseline(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    if s.status not in ("active", "pending"):
        raise HTTPException(400, "Session must be active to capture baseline")
    path = await session_service.capture_baseline(db, s)
    await db.commit()
    return {"baseline_path": path}


@router.post("/{session_id}/reset-baseline", response_model=dict)
async def reset_baseline(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    if s.status != "active":
        raise HTTPException(400, "Session must be active to reset baseline")
    path = await session_service.reset_baseline(db, s)
    await db.commit()
    return {"baseline_path": path}


@router.post("/{session_id}/end", response_model=SessionOut)
async def end_session(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    await session_service.end_session(db, s)
    await db.commit()
    return await _get_session_or_404(session_id, db)


@router.post("/{session_id}/next-player", response_model=dict)
async def next_player(session_id: int, db: AsyncSession = Depends(get_db)):
    s = await _get_session_or_404(session_id, db)
    sp = await session_service.switch_to_next_player(db, s)
    await db.commit()
    if not sp:
        return {"message": "No players in session"}
    return {"active_player_id": sp.player_id, "turn_order": sp.turn_order}


# ── Detections in session ────────────────────────────────────────────────────

@router.get("/{session_id}/detections", response_model=list[DetectionOut])
async def get_session_detections(
    session_id: int,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    await _get_session_or_404(session_id, db)
    q = select(Detection).where(Detection.session_id == session_id)
    if status:
        q = q.where(Detection.status == status)
    q = q.order_by(Detection.detected_at.desc())
    result = await db.execute(q)
    return result.scalars().all()
