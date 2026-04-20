from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.entry import Entry
from app.models.entry_mission import EntryMission
from app.models.game import Game
from app.models.user import User
from app.schemas.entry_schema import EntryCreate
from app.services.ticket_service import generate_ticket


def calculate_is_win(entry: Entry, game: Game) -> bool | None:
    if game.home_score is None or game.away_score is None:
        return None

    if entry.watched_team == game.home_team:
        return game.home_score > game.away_score

    if entry.watched_team == game.away_team:
        return game.away_score > game.home_score

    return None


def generate_diary(entry: Entry, game: Game) -> str:
    is_win = calculate_is_win(entry, game)
    opponent = game.away_team if entry.watched_team == game.home_team else game.home_team

    first_sentence = f"오늘 {entry.watched_team} 경기를 보러 간 하루는 시작부터 괜히 마음이 들뜨는 날이었다."

    memo_text = entry.memo.strip() if entry.memo else None

    if game.home_score is not None and game.away_score is not None and memo_text:
        second_sentence = (
            f"{game.home_team}와 {game.away_team}가 {game.home_score}대 {game.away_score}로 맞붙는 내내, "
            f"{memo_text} 장면이 특히 오래 남았고 {opponent}전이라 더 손에 땀이 났다."
        )
    elif game.home_score is not None and game.away_score is not None:
        second_sentence = (
            f"{game.home_team}와 {game.away_team}가 {game.home_score}대 {game.away_score}로 맞붙는 동안, "
            f"{opponent}만 만나면 더 괜히 승부욕이 올라왔다."
        )
    elif memo_text:
        second_sentence = (
            f"아직 점수는 또렷하지 않았지만 {memo_text} 순간 덕분에 오늘 직관의 온도는 확실하게 기억될 것 같았다."
        )
    else:
        second_sentence = (
            f"{game.home_team}와 {game.away_team}가 맞붙는 내내 결과보다도 현장의 분위기 자체가 오래 남을 것 같았다."
        )

    if is_win is True:
        third_sentence = "결국 웃으면서 집에 갈 수 있어서, 오늘은 응원한 보람이 제대로 느껴지는 밤이었다."
    elif is_win is False:
        third_sentence = "조금 씁쓸하긴 했지만 이런 날까지 품어야 진짜 팬 같아서, 괜히 더 오래 기억에 남을 것 같다."
    else:
        third_sentence = "승패가 아직 또렷하지 않아도 오늘의 공기와 함성만으로 이미 꽤 근사한 하루였다."

    return " ".join([first_sentence, second_sentence, third_sentence])


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
    entry.diary_text = generate_diary(entry, game)
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
