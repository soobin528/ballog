from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate, UserUpdate


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "nickname": user.username,
        "favorite_team": user.favorite_team,
        "fan_since_year": user.fan_since_year,
        "favorite_player": user.favorite_player,
        "home_stadium": user.home_stadium,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def create_user(db: Session, payload: UserCreate) -> dict:
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email is not None:
        raise HTTPException(status_code=400, detail="Email already exists")

    existing_nickname = db.query(User).filter(User.username == payload.nickname).first()
    if existing_nickname is not None:
        raise HTTPException(status_code=400, detail="Nickname already exists")

    user = User(
        email=payload.email,
        username=payload.nickname,
        favorite_team=payload.favorite_team,
        fan_since_year=None,
        favorite_player=None,
        home_stadium=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


def get_user_by_id(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)


def update_user(db: Session, user_id: int, payload: UserUpdate) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    fields_set = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))

    if "nickname" in fields_set and payload.nickname is not None and payload.nickname != user.username:
        existing_nickname = db.query(User).filter(User.username == payload.nickname).first()
        if existing_nickname is not None:
            raise HTTPException(status_code=400, detail="Nickname already exists")
        user.username = payload.nickname

    if "favorite_team" in fields_set:
        user.favorite_team = payload.favorite_team
    if "fan_since_year" in fields_set:
        user.fan_since_year = payload.fan_since_year
    if "favorite_player" in fields_set:
        user.favorite_player = payload.favorite_player
    if "home_stadium" in fields_set:
        user.home_stadium = payload.home_stadium

    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


def list_users(db: Session) -> list[dict]:
    users = db.query(User).order_by(User.id.asc()).all()
    return [serialize_user(user) for user in users]
