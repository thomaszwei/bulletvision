"""
WebSocket endpoint router.
Handles the /ws/session/{session_id} connection and routes incoming client events.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import ws_manager

logger = logging.getLogger(__name__)

ws_router = APIRouter()


@ws_router.websocket("/ws/session/{session_id}")
async def session_websocket(session_id: int, ws: WebSocket):
    await ws_manager.connect(session_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = msg.get("type")
            data = msg.get("data", {})

            if event_type == "ping":
                await ws_manager.send_to(ws, {"type": "pong"})

            elif event_type == "confirm_detection":
                detection_id = data.get("detection_id")
                if detection_id:
                    await _handle_confirm(detection_id, session_id)

            elif event_type == "reject_detection":
                detection_id = data.get("detection_id")
                if detection_id:
                    await _handle_reject(detection_id, session_id)

    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(session_id, ws)


async def _handle_confirm(detection_id: int, session_id: int) -> None:
    """Process confirm via WebSocket (same logic as REST endpoint)."""
    from app.database import AsyncSessionLocal
    from app.models.detection import Detection
    from app.services.scoring_service import award_points_for_detection
    from app.ws.events import build_detection_updated_event
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Detection).where(Detection.id == detection_id))
        d = result.scalar_one_or_none()
        if not d or d.status != "pending":
            return
        d.status = "confirmed"
        await db.flush()
        await award_points_for_detection(db, d)
        await db.commit()
        await db.refresh(d)
        await ws_manager.broadcast_to_session(session_id, build_detection_updated_event(d))


async def _handle_reject(detection_id: int, session_id: int) -> None:
    from app.database import AsyncSessionLocal
    from app.models.detection import Detection
    from app.ws.events import build_detection_updated_event
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Detection).where(Detection.id == detection_id))
        d = result.scalar_one_or_none()
        if not d:
            return
        d.status = "rejected"
        await db.commit()
        await db.refresh(d)
        await ws_manager.broadcast_to_session(session_id, build_detection_updated_event(d))
