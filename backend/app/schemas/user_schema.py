from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    nickname: str
    favorite_team: str


class UserUpdate(BaseModel):
    nickname: str | None = None
    favorite_team: str | None = None
    fan_since_year: int | None = None
    favorite_player: str | None = None
    home_stadium: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    favorite_team: str | None
    fan_since_year: int | None = None
    favorite_player: str | None = None
    home_stadium: str | None = None
    created_at: datetime
    updated_at: datetime
