from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.entry_schema import EntryCreate, EntryResponse
from app.services import entry_service

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("", response_model=EntryResponse)
def create_entry(payload: EntryCreate, db: Session = Depends(get_db)):
    return entry_service.create_entry(db, payload)


@router.get("/{entry_id}", response_model=EntryResponse)
def get_entry(entry_id: int, db: Session = Depends(get_db)):
    return entry_service.get_entry_by_id(db, entry_id)


@router.get("", response_model=list[EntryResponse])
def list_entries(
    user_id: int | None = None,
    game_id: int | None = None,
    db: Session = Depends(get_db),
):
    return entry_service.list_entries(db, user_id=user_id, game_id=game_id)
