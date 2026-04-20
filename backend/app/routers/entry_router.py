from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.entry import Entry

router = APIRouter(prefix="/entries", tags=["entries"])


class EntryCreate(BaseModel):
    user_id: int
    game_id: int
    watched_team: str
    memo: str | None = None


@router.post("")
def create_entry(payload: EntryCreate, db: Session = Depends(get_db)):
    entry = Entry(
        user_id=payload.user_id,
        game_id=payload.game_id,
        watched_team=payload.watched_team,
        memo=payload.memo,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "game_id": entry.game_id,
        "watched_team": entry.watched_team,
        "memo": entry.memo,
        "missions": [],
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


@router.get("/{entry_id}")
def get_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = (
        db.query(Entry)
        .options(joinedload(Entry.missions))
        .filter(Entry.id == entry_id)
        .first()
    )

    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "game_id": entry.game_id,
        "watched_team": entry.watched_team,
        "memo": entry.memo,
        "missions": [
            {
                "id": mission.id,
                "title": mission.title,
                "is_completed": mission.is_completed,
                "created_at": mission.created_at,
                "updated_at": mission.updated_at,
            }
            for mission in entry.missions
        ],
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }
