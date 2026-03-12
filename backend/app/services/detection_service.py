"""
Detection service — runs the CV pipeline against the active session baseline,
persists detections to the database, and broadcasts WebSocket events.

Detection loop runs as an asyncio task, not a thread, so it can await DB writes
and WS broadcasts. Frame grabbing is still done on the camera thread; we only
read the latest frame here (non-blocking).
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import cv2

from app.config import settings
from app.cv.pipeline import PipelineConfig, run_pipeline, preprocess
from app.cv.alignment import align_frame
from app.cv.annotate import draw_detection

logger = logging.getLogger(__name__)

# In-memory baseline state per session (session_id → numpy grayscale array)
_baselines: dict[int, object] = {}  # type: dict[int, np.ndarray]
# Confirmed detection circles per session (session_id → list of (px, py, pr))
_confirmed: dict[int, list[tuple[float, float, float]]] = {}

# The currently active session being monitored
_active_session_id: int | None = None
_detection_task: asyncio.Task | None = None


# ── Baseline management ───────────────────────────────────────────────────────

def set_baseline(session_id: int, frame) -> None:
    """
    Store a preprocessed baseline frame in memory.
    `frame` should be a BGR numpy array (raw camera frame).
    """
    import numpy as np
    processed = preprocess(frame)
    _baselines[session_id] = processed
    _confirmed[session_id] = []
    logger.info(f"Baseline set for session {session_id}")


def clear_baseline(session_id: int) -> None:
    _baselines.pop(session_id, None)
    _confirmed.pop(session_id, None)


def add_confirmed_circle(session_id: int, px: float, py: float, pr: float) -> None:
    _confirmed.setdefault(session_id, []).append((px, py, pr))


def remove_confirmed_circle(session_id: int, px: float, py: float) -> None:
    """Remove a confirmed circle from suppression list (on reject)."""
    circles = _confirmed.get(session_id, [])
    _confirmed[session_id] = [
        c for c in circles if abs(c[0] - px) > 5 or abs(c[1] - py) > 5
    ]


# ── Loop lifecycle ────────────────────────────────────────────────────────────

def start_detection_loop(session_id: int) -> None:
    global _active_session_id, _detection_task
    _active_session_id = session_id
    loop = asyncio.get_running_loop()
    if _detection_task and not _detection_task.done():
        _detection_task.cancel()
    _detection_task = loop.create_task(
        _detection_loop(session_id), name=f"detection-{session_id}"
    )
    logger.info(f"Detection loop started for session {session_id}")


def stop_detection_loop() -> None:
    global _active_session_id, _detection_task
    _active_session_id = None
    if _detection_task and not _detection_task.done():
        _detection_task.cancel()
        _detection_task = None
    logger.info("Detection loop stopped.")


# ── Main detection loop ───────────────────────────────────────────────────────

async def _detection_loop(session_id: int) -> None:
    from app.services.camera_service import camera_service
    from app.database import AsyncSessionLocal
    from app.models.detection import Detection as DetectionModel
    from app.ws.manager import ws_manager
    from app.ws.events import build_detection_new_event

    interval = 1.0 / settings.detection_fps
    logger.info(f"Detection loop running at {settings.detection_fps} FPS")

    while True:
        t0 = asyncio.get_running_loop().time()

        baseline = _baselines.get(session_id)
        if baseline is None:
            await asyncio.sleep(interval)
            continue

        frame = camera_service.get_frame()
        if frame is None:
            await asyncio.sleep(interval)
            continue

        # Optional alignment
        if settings.detection_alignment_enabled:
            import cv2 as _cv2
            current_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            current_gray = align_frame(baseline, current_gray)
            # Rebuild a fake BGR frame from aligned gray for pipeline
            frame_for_pipeline = cv2.cvtColor(current_gray, cv2.COLOR_GRAY2BGR)
        else:
            frame_for_pipeline = frame

        # Build config from settings (can be overridden at runtime via /api/settings)
        config = PipelineConfig(
            min_area=settings.detection_min_area,
            max_area=settings.detection_max_area,
            min_circularity=settings.detection_circularity,
            darkness_threshold=settings.detection_darkness_threshold,
            confidence_threshold=settings.detection_confidence_threshold,
        )

        confirmed = _confirmed.get(session_id, [])
        candidates = run_pipeline(baseline, frame_for_pipeline, config, confirmed)

        for cand in candidates:
            try:
                # Save snapshot frames
                frame_path, annotated_path = await _save_detection_frames(
                    session_id, frame, cand.px, cand.py, cand.pr, cand.status if hasattr(cand, "status") else "pending", cand.confidence
                )

                # Persist to DB
                async with AsyncSessionLocal() as db:
                    det = DetectionModel(
                        session_id=session_id,
                        player_id=await _get_active_player_id(db, session_id),
                        x=cand.x,
                        y=cand.y,
                        radius=cand.radius,
                        confidence=cand.confidence,
                        status="pending",
                        frame_path=frame_path,
                        annotated_path=annotated_path,
                    )
                    db.add(det)
                    await db.commit()
                    await db.refresh(det)

                    # Track in memory for overlap suppression
                    add_confirmed_circle(session_id, cand.px, cand.py, cand.pr)

                    # Broadcast via WebSocket
                    event = build_detection_new_event(det)
                    await ws_manager.broadcast_to_session(session_id, event)
                    logger.info(
                        f"Detection #{det.id} session={session_id} "
                        f"confidence={cand.confidence:.2f} pos=({cand.x:.3f},{cand.y:.3f})"
                    )

            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception(f"Error persisting detection: {exc}")

        elapsed = asyncio.get_running_loop().time() - t0
        await asyncio.sleep(max(0.0, interval - elapsed))


async def _get_active_player_id(db, session_id: int) -> int | None:
    from sqlalchemy import select
    from app.models.session_player import SessionPlayer
    result = await db.execute(
        select(SessionPlayer.player_id)
        .where(SessionPlayer.session_id == session_id, SessionPlayer.is_active == True)  # noqa: E712
    )
    row = result.first()
    return row[0] if row else None


async def _save_detection_frames(
    session_id: int, frame, px: float, py: float, pr: float,
    status: str = "pending", confidence: float = 0.0
) -> tuple[str, str]:
    """Save raw + annotated frames to disk. Returns relative paths."""
    ts = int(time.time() * 1000)
    frames_dir = Path(settings.data_dir) / "snapshots" / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    raw_name = f"det_{session_id}_{ts}_raw.jpg"
    ann_name = f"det_{session_id}_{ts}_ann.jpg"
    raw_path = frames_dir / raw_name
    ann_path = frames_dir / ann_name

    cv2.imwrite(str(raw_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

    annotated = draw_detection(frame, px, py, pr, status=status, confidence=confidence)
    cv2.imwrite(str(ann_path), annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])

    # Return paths relative to data_dir for portability
    rel_raw = str(Path("snapshots") / "frames" / raw_name)
    rel_ann = str(Path("snapshots") / "frames" / ann_name)
    return rel_raw, rel_ann
