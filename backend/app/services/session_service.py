"""
Session service — state machine for sessions.
Handles start, baseline capture/reset, player switching, and session end.
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import cv2
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.session import Session
from app.models.session_player import SessionPlayer
from app.models.detection import Detection

logger = logging.getLogger(__name__)


async def start_session(db: AsyncSession, session: Session) -> Session:
    """Transition session from pending → active. Start the detection loop."""
    if session.status != "pending":
        raise ValueError(f"Cannot start a session with status '{session.status}'")

    session.status = "active"
    await db.flush()

    from app.services.detection_service import start_detection_loop
    start_detection_loop(session.id)

    from app.ws.manager import ws_manager
    await ws_manager.broadcast_to_session(session.id, {
        "type": "session_started",
        "data": {"session_id": session.id},
    })
    return session


async def capture_baseline(db: AsyncSession, session: Session) -> str:
    """
    Capture the current camera frame and store it as the session baseline.
    Returns the path to the saved baseline image.
    """
    from app.services.camera_service import camera_service
    from app.services.detection_service import set_baseline, clear_baseline

    frame = camera_service.get_frame()
    if frame is None:
        raise RuntimeError("Camera not available — cannot capture baseline")

    baseline_dir = Path(settings.data_dir) / "snapshots" / "baselines"
    baseline_dir.mkdir(parents=True, exist_ok=True)

    filename = f"baseline_{session.id}_{int(time.time())}.jpg"
    filepath = baseline_dir / filename
    cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

    rel_path = str(Path("snapshots") / "baselines" / filename)
    session.baseline_path = rel_path
    await db.flush()

    set_baseline(session.id, frame)
    logger.info(f"Baseline captured for session {session.id}: {rel_path}")
    return rel_path


async def reset_baseline(db: AsyncSession, session: Session) -> str:
    """
    Reset baseline to current frame. Pending detections are rejected.
    Does NOT delete confirmed detections — they stay in history.
    """
    # Reject all pending detections
    result = await db.execute(
        select(Detection).where(
            Detection.session_id == session.id,
            Detection.status == "pending",
        )
    )
    pending = result.scalars().all()
    for det in pending:
        det.status = "rejected"
    await db.flush()

    path = await capture_baseline(db, session)

    from app.ws.manager import ws_manager
    await ws_manager.broadcast_to_session(session.id, {
        "type": "baseline_reset",
        "data": {"session_id": session.id, "baseline_path": path},
    })
    return path


async def end_session(db: AsyncSession, session: Session) -> Session:
    """End the session. Stop detection loop."""
    from app.services.detection_service import stop_detection_loop, clear_baseline

    session.status = "ended"
    session.ended_at = datetime.now(timezone.utc)
    await db.flush()

    stop_detection_loop()
    clear_baseline(session.id)

    from app.ws.manager import ws_manager
    await ws_manager.broadcast_to_session(session.id, {
        "type": "session_ended",
        "data": {"session_id": session.id},
    })
    return session


async def switch_to_next_player(db: AsyncSession, session: Session) -> SessionPlayer | None:
    """
    In turn-based mode: deactivate current player, activate the next in turn_order.
    Returns the new active SessionPlayer, or None if no players.
    """
    result = await db.execute(
        select(SessionPlayer)
        .where(SessionPlayer.session_id == session.id)
        .order_by(SessionPlayer.turn_order)
    )
    players = result.scalars().all()
    if not players:
        return None

    active_idx = next(
        (i for i, sp in enumerate(players) if sp.is_active),
        len(players) - 1
    )
    next_idx = (active_idx + 1) % len(players)

    for sp in players:
        sp.is_active = False
    players[next_idx].is_active = True
    await db.flush()

    next_player = players[next_idx]

    from app.ws.manager import ws_manager
    await ws_manager.broadcast_to_session(session.id, {
        "type": "player_switched",
        "data": {
            "session_id": session.id,
            "player_id": next_player.player_id,
            "turn_order": next_player.turn_order,
        },
    })
    return next_player
