from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.score import Score
from app.schemas.score import ScoreOut, HighscoreEntry
from app.services.scoring_service import get_highscores

router = APIRouter()


@router.get("", response_model=list[ScoreOut])
async def list_scores(
    session_id: int | None = Query(None),
    player_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Score).order_by(Score.created_at.desc())
    if session_id:
        q = q.where(Score.session_id == session_id)
    if player_id:
        q = q.where(Score.player_id == player_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/highscores", response_model=list[HighscoreEntry])
async def highscores(
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await get_highscores(db, limit=limit)
