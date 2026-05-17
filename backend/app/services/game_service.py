from datetime import date, datetime, time, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.game import Game
from app.schemas.game_schema import GameCreate, GameUpdate


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def normalize_required_text(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    return normalized


def validate_score(score: int | None, field_name: str) -> None:
    if score is not None and score < 0:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be greater than or equal to 0",
        )


def validate_teams(home_team: str, away_team: str) -> None:
    if home_team == away_team:
        raise HTTPException(status_code=400, detail="home_team and away_team must be different")


def validate_game_payload(payload: GameCreate) -> tuple[str | None, str, str]:
    stadium = normalize_optional_text(payload.stadium)
    home_team = normalize_required_text(payload.home_team, "home_team")
    away_team = normalize_required_text(payload.away_team, "away_team")
    validate_teams(home_team, away_team)
    validate_score(payload.home_score, "home_score")
    validate_score(payload.away_score, "away_score")
    return stadium, home_team, away_team


def get_fields_set(payload) -> set[str]:
    if hasattr(payload, "model_fields_set"):
        return payload.model_fields_set

    return payload.__fields_set__


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
    stadium, home_team, away_team = validate_game_payload(payload)

    existing_game = (
        db.query(Game)
        .filter(
            Game.game_date == payload.game_date,
            Game.venue == stadium,
            Game.home_team == home_team,
            Game.away_team == away_team,
        )
        .first()
    )

    if existing_game is not None:
        existing_game.home_score = payload.home_score
        existing_game.away_score = payload.away_score
        existing_game.status = normalize_optional_text(payload.status)
        db.add(existing_game)
        db.commit()
        db.refresh(existing_game)
        return serialize_game(existing_game)

    game = Game(
        game_date=payload.game_date,
        venue=stadium,
        home_team=home_team,
        away_team=away_team,
        home_score=payload.home_score,
        away_score=payload.away_score,
        status=normalize_optional_text(payload.status),
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


def update_game(db: Session, game_id: int, payload: GameUpdate) -> dict:
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    fields_set = get_fields_set(payload)

    if "game_date" in fields_set:
        game.game_date = payload.game_date
    if "stadium" in fields_set:
        game.venue = normalize_optional_text(payload.stadium)
    if "home_team" in fields_set and payload.home_team is not None:
        game.home_team = normalize_required_text(payload.home_team, "home_team")
    if "away_team" in fields_set and payload.away_team is not None:
        game.away_team = normalize_required_text(payload.away_team, "away_team")
    if "home_score" in fields_set:
        validate_score(payload.home_score, "home_score")
        game.home_score = payload.home_score
    if "away_score" in fields_set:
        validate_score(payload.away_score, "away_score")
        game.away_score = payload.away_score
    if "status" in fields_set:
        game.status = normalize_optional_text(payload.status)

    validate_teams(game.home_team, game.away_team)

    db.add(game)
    db.commit()
    db.refresh(game)
    return serialize_game(game)


def list_games(
    db: Session,
    game_date: date | None = None,
    stadium: str | None = None,
) -> list[dict]:
    query = db.query(Game)

    if game_date is not None:
        start_of_day = datetime.combine(game_date, time.min)
        end_of_day = start_of_day + timedelta(days=1)
        query = query.filter(Game.game_date >= start_of_day, Game.game_date < end_of_day)

    normalized_stadium = normalize_optional_text(stadium)
    if normalized_stadium:
        query = query.filter(Game.venue == normalized_stadium)

    games = query.order_by(Game.game_date.asc(), Game.id.asc()).all()
    return [serialize_game(game) for game in games]
