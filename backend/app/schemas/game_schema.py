from datetime import datetime

from pydantic import BaseModel


class GameCreate(BaseModel):
    game_date: datetime
    stadium: str | None = None
    home_team: str
    away_team: str
    home_score: int | None = None
    away_score: int | None = None
    status: str | None = None


class GameResponse(BaseModel):
    id: int
    game_date: datetime
    stadium: str | None
    home_team: str
    away_team: str
    home_score: int | None
    away_score: int | None
    status: str | None
    created_at: datetime
    updated_at: datetime
