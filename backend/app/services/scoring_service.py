"""
Scoring service — awards points, updates session_player scores, checks achievements.
"""
from __future__ import annotations

import json
import logging

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.detection import Detection
from app.models.score import Score
from app.models.session_player import SessionPlayer
from app.models.achievement import Achievement

logger = logging.getLogger(__name__)


async def award_points_for_detection(
    db: AsyncSession,
    detection: Detection,
    points_override: int | None = None,
) -> Score:
    """
    Called when a detection is confirmed.
    Creates a Score row and increments the session_player score.
    Returns the new Score.
    """
    points = points_override if points_override is not None else settings.points_per_hole

    # Zone scoring (future — currently always "none")
    zone = "none"

    score = Score(
        session_id=detection.session_id,
        player_id=detection.player_id,
        detection_id=detection.id,
        points=points,
        zone=zone,
    )
    db.add(score)

    # Increment session_player.score
    if detection.player_id:
        result = await db.execute(
            select(SessionPlayer).where(
                SessionPlayer.session_id == detection.session_id,
                SessionPlayer.player_id == detection.player_id,
            )
        )
        sp = result.scalar_one_or_none()
        if sp:
            sp.score += points
            sp.shots_fired += 1

    await db.flush()
    await _check_achievements(db, detection)
    return score


async def _check_achievements(db: AsyncSession, detection: Detection) -> None:
    if not detection.player_id:
        return

    # First blood — first ever detection for this player
    result = await db.execute(
        select(func.count(Detection.id)).where(
            Detection.player_id == detection.player_id,
            Detection.status == "confirmed",
        )
    )
    count = result.scalar_one()

    achievement_map = {
        1: "first_blood",
        5: "five_holes",
        10: "ten_round_shooter",
        25: "sharpshooter",
        50: "marksman",
        100: "legend",
    }

    if count in achievement_map:
        atype = achievement_map[count]
        existing = await db.execute(
            select(Achievement).where(
                Achievement.player_id == detection.player_id,
                Achievement.achievement_type == atype,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(Achievement(
                player_id=detection.player_id,
                achievement_type=atype,
                data_json=json.dumps({"detection_id": detection.id, "count": count}),
            ))
            logger.info(f"Achievement '{atype}' awarded to player {detection.player_id}")


async def get_highscores(db: AsyncSession, limit: int = 20) -> list[dict]:
    """Aggregate total scores per player across all sessions."""
    from app.models.player import Player

    result = await db.execute(
        select(
            Player.id,
            Player.name,
            Player.avatar_color,
            func.coalesce(func.sum(Score.points), 0).label("total_score"),
            func.count(func.distinct(Score.session_id)).label("sessions_played"),
        )
        .outerjoin(Score, Score.player_id == Player.id)
        .group_by(Player.id)
        .order_by(func.coalesce(func.sum(Score.points), 0).desc())
        .limit(limit)
    )
    rows = result.all()

    highscores = []
    for rank, row in enumerate(rows, start=1):
        # shots fired and confirmed
        sp_result = await db.execute(
            select(
                func.sum(SessionPlayer.shots_fired),
                func.sum(SessionPlayer.score),
            ).where(SessionPlayer.player_id == row.id)
        )
        sp_row = sp_result.first()
        shots_fired = sp_row[0] or 0
        best_result = await db.execute(
            select(func.max(SessionPlayer.score)).where(SessionPlayer.player_id == row.id)
        )
        best_score = best_result.scalar_one_or_none()
        accuracy = (row.total_score / (shots_fired * settings.points_per_hole)) if shots_fired > 0 else 0.0

        highscores.append({
            "rank": rank,
            "player_id": row.id,
            "player_name": row.name,
            "avatar_color": row.avatar_color,
            "total_score": row.total_score,
            "sessions_played": row.sessions_played,
            "accuracy": round(min(accuracy, 1.0), 4),
            "best_session_score": best_score,
        })
    return highscores
