from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.entry import Entry
from app.models.entry_mission import EntryMission
from app.models.game import Game
from app.models.user import User
from app.schemas.entry_schema import EntryCreate
from app.services.diary_service import DiaryMission, calculate_is_win, generate_diary
from app.services.ticket_service import generate_ticket


def serialize_entry(entry: Entry) -> dict:
    game = entry.game
    missions = [
        {
            "id": mission.id,
            "title": mission.title,
            "is_completed": mission.is_completed,
            "created_at": mission.created_at,
            "updated_at": mission.updated_at,
        }
        for mission in entry.missions
    ]

    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "game_id": entry.game_id,
        "watched_team": entry.watched_team,
        "memo": entry.memo,
        "diary_text": entry.diary_text,
        "ticket_image_url": entry.ticket_image_url,
        "is_win": calculate_is_win(entry, game) if game else None,
        "mission_success_count": sum(1 for mission in entry.missions if mission.is_completed),
        "missions": missions,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


def create_entry(db: Session, payload: EntryCreate) -> dict:
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    game = db.query(Game).filter(Game.id == payload.game_id).first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    if payload.watched_team not in {game.home_team, game.away_team}:
        raise HTTPException(status_code=400, detail="watched_team must match home_team or away_team")

    entry = Entry(
        user_id=payload.user_id,
        game_id=payload.game_id,
        watched_team=payload.watched_team,
        memo=payload.memo,
    )
    diary_missions = [
        DiaryMission(title=mission.title, is_completed=mission.is_completed)
        for mission in payload.missions
    ]
    if payload.auto_generate_diary:
        entry.diary_text = generate_diary(entry, game, diary_missions)
    else:
        manual_diary = (payload.diary_text or payload.memo or "").strip()
        entry.diary_text = manual_diary or None
    db.add(entry)
    db.flush()

    for mission_payload in payload.missions:
        mission = EntryMission(
            entry_id=entry.id,
            title=mission_payload.title,
            is_completed=mission_payload.is_completed,
        )
        db.add(mission)

    db.commit()
    entry.ticket_image_url = generate_ticket(entry, game)
    db.add(entry)
    db.commit()

    return get_entry_by_id(db, entry.id)


def get_entry_by_id(db: Session, entry_id: int) -> dict:
    entry = (
        db.query(Entry)
        .options(joinedload(Entry.game), joinedload(Entry.missions))
        .filter(Entry.id == entry_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return serialize_entry(entry)


def list_entries(db: Session, user_id: int | None = None, game_id: int | None = None) -> list[dict]:
    query = db.query(Entry).options(joinedload(Entry.game), joinedload(Entry.missions))

    if user_id is not None:
        query = query.filter(Entry.user_id == user_id)

    if game_id is not None:
        query = query.filter(Entry.game_id == game_id)

    entries = query.order_by(Entry.id.asc()).all()
    return [serialize_entry(entry) for entry in entries]
