from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate, UserUpdate


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


def validate_fan_since_year(year: int | None) -> None:
    if year is not None and (year < 1900 or year > 2100):
        raise HTTPException(
            status_code=400,
            detail="fan_since_year must be between 1900 and 2100",
        )


def get_fields_set(payload) -> set[str]:
    if hasattr(payload, "model_fields_set"):
        return payload.model_fields_set

    return payload.__fields_set__


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
    email = normalize_required_text(payload.email, "email")
    nickname = normalize_required_text(payload.nickname, "nickname")
    favorite_team = normalize_optional_text(payload.favorite_team)

    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email is not None:
        raise HTTPException(status_code=400, detail="Email already exists")

    existing_nickname = db.query(User).filter(User.username == nickname).first()
    if existing_nickname is not None:
        raise HTTPException(status_code=400, detail="Nickname already exists")

    user = User(
        email=email,
        username=nickname,
        favorite_team=favorite_team,
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

    fields_set = get_fields_set(payload)

    if "nickname" in fields_set and payload.nickname is not None:
        nickname = normalize_required_text(payload.nickname, "nickname")
        if nickname != user.username:
            existing_nickname = db.query(User).filter(User.username == nickname).first()
            if existing_nickname is not None:
                raise HTTPException(status_code=400, detail="Nickname already exists")
            user.username = nickname

    if "favorite_team" in fields_set:
        user.favorite_team = normalize_optional_text(payload.favorite_team)
    if "fan_since_year" in fields_set:
        validate_fan_since_year(payload.fan_since_year)
        user.fan_since_year = payload.fan_since_year
    if "favorite_player" in fields_set:
        user.favorite_player = normalize_optional_text(payload.favorite_player)
    if "home_stadium" in fields_set:
        user.home_stadium = normalize_optional_text(payload.home_stadium)

    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


def list_users(db: Session) -> list[dict]:
    users = db.query(User).order_by(User.id.asc()).all()
    return [serialize_user(user) for user in users]
