from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.game_schema import GameCreate, GameResponse
from app.services import game_service

router = APIRouter(prefix="/games", tags=["games"])


@router.post("", response_model=GameResponse)
def create_game(payload: GameCreate, db: Session = Depends(get_db)):
    return game_service.create_game(db, payload)


@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: int, db: Session = Depends(get_db)):
    return game_service.get_game_by_id(db, game_id)


@router.get("", response_model=list[GameResponse])
def list_games(
    game_date: date | None = None,
    stadium: str | None = None,
    db: Session = Depends(get_db),
):
    return game_service.list_games(db, game_date=game_date, stadium=stadium)
