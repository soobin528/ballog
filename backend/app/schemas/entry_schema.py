from datetime import datetime

from pydantic import BaseModel, Field


class EntryMissionCreate(BaseModel):
    title: str
    is_completed: bool = False


class EntryMissionResponse(BaseModel):
    id: int
    title: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime


class EntryCreate(BaseModel):
    user_id: int
    game_id: int
    watched_team: str
    memo: str | None = None
    missions: list[EntryMissionCreate] = Field(default_factory=list)


class EntryResponse(BaseModel):
    id: int
    user_id: int
    game_id: int
    watched_team: str
    memo: str | None
    is_win: bool | None
    mission_success_count: int
    missions: list[EntryMissionResponse]
    created_at: datetime
    updated_at: datetime
