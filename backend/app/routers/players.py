from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.player import Player
from app.models.session_player import SessionPlayer
from app.models.detection import Detection
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerOut, PlayerStats

router = APIRouter()


async def _get_player_or_404(player_id: int, db: AsyncSession) -> Player:
    result = await db.execute(select(Player).where(Player.id == player_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    return p


@router.get("", response_model=list[PlayerOut])
async def list_players(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).order_by(Player.name))
    return result.scalars().all()


@router.post("", response_model=PlayerOut, status_code=status.HTTP_201_CREATED)
async def create_player(body: PlayerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Player).where(Player.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Player '{body.name}' already exists")
    player = Player(name=body.name, avatar_color=body.avatar_color)
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return player


@router.get("/{player_id}", response_model=PlayerOut)
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_player_or_404(player_id, db)


@router.put("/{player_id}", response_model=PlayerOut)
async def update_player(
    player_id: int, body: PlayerUpdate, db: AsyncSession = Depends(get_db)
):
    p = await _get_player_or_404(player_id, db)
    if body.name is not None:
        p.name = body.name
    if body.avatar_color is not None:
        p.avatar_color = body.avatar_color
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player(player_id: int, db: AsyncSession = Depends(get_db)):
    p = await _get_player_or_404(player_id, db)
    await db.delete(p)
    await db.commit()


@router.get("/{player_id}/stats", response_model=PlayerStats)
async def get_player_stats(player_id: int, db: AsyncSession = Depends(get_db)):
    p = await _get_player_or_404(player_id, db)

    # Total score from scores table
    from app.models.score import Score
    score_result = await db.execute(
        select(func.coalesce(func.sum(Score.points), 0)).where(Score.player_id == player_id)
    )
    total_score = score_result.scalar_one()

    # Sessions played
    sessions_result = await db.execute(
        select(func.count(SessionPlayer.id)).where(SessionPlayer.player_id == player_id)
    )
    sessions_played = sessions_result.scalar_one()

    # Shots fired (sum of session_player.shots_fired)
    shots_result = await db.execute(
        select(func.coalesce(func.sum(SessionPlayer.shots_fired), 0))
        .where(SessionPlayer.player_id == player_id)
    )
    shots_fired = shots_result.scalar_one()

    # Confirmed shots
    confirmed_result = await db.execute(
        select(func.count(Detection.id)).where(
            Detection.player_id == player_id,
            Detection.status == "confirmed",
        )
    )
    shots_confirmed = confirmed_result.scalar_one()

    accuracy = (shots_confirmed / shots_fired) if shots_fired > 0 else 0.0

    # Best session score
    best_result = await db.execute(
        select(func.max(SessionPlayer.score)).where(SessionPlayer.player_id == player_id)
    )
    best_session = best_result.scalar_one_or_none()

    return PlayerStats(
        player_id=player_id,
        player_name=p.name,
        total_score=total_score,
        sessions_played=sessions_played,
        shots_fired=shots_fired,
        shots_confirmed=shots_confirmed,
        accuracy=round(accuracy, 4),
        best_session_score=best_session,
    )
