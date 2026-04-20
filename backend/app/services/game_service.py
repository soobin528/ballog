from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.game import Game
from app.schemas.game_schema import GameCreate


def serialize_game(game: Game) -> dict:
    return {
        "id": game.id,
        "game_date": game.game_date,
        "stadium": game.venue,
        "home_team": game.home_team,
        "away_team": game.away_team,
        "home_score": game.home_score,
        "away_score": game.away_score,
        "status": game.status,
        "created_at": game.created_at,
        "updated_at": game.updated_at,
    }


def create_game(db: Session, payload: GameCreate) -> dict:
    game = Game(
        game_date=payload.game_date,
        venue=payload.stadium,
        home_team=payload.home_team,
        away_team=payload.away_team,
        home_score=payload.home_score,
        away_score=payload.away_score,
        status=payload.status,
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return serialize_game(game)


def get_game_by_id(db: Session, game_id: int) -> dict:
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return serialize_game(game)


def list_games(db: Session, game_date: date | None = None, stadium: str | None = None) -> list[dict]:
    query = db.query(Game)

    if game_date is not None:
        start_of_day = datetime.combine(game_date, time.min)
        end_of_day = start_of_day + timedelta(days=1)
        query = query.filter(Game.game_date >= start_of_day, Game.game_date < end_of_day)

    if stadium:
        query = query.filter(Game.venue == stadium)

    games = query.order_by(Game.game_date.asc(), Game.id.asc()).all()
    return [serialize_game(game) for game in games]
