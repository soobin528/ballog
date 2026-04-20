from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    nickname: str
    favorite_team: str


class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    favorite_team: str | None
    created_at: datetime
    updated_at: datetime
