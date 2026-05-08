import hashlib
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime

from app.models.entry import Entry
from app.models.game import Game


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_DIARY_MODEL = "gpt-4.1-nano"


@dataclass(frozen=True)
class DiaryMission:
    title: str
    is_completed: bool


def calculate_is_win(entry: Entry, game: Game) -> bool | None:
    if game.home_score is None or game.away_score is None:
        return None

    if entry.watched_team == game.home_team:
        return game.home_score > game.away_score

    if entry.watched_team == game.away_team:
        return game.away_score > game.home_score

    return None


def generate_diary(entry: Entry, game: Game, missions: list[DiaryMission] | None = None) -> str:
    missions = missions or []

    llm_diary = generate_openai_diary(entry, game, missions)
    if llm_diary:
        return llm_diary

    return generate_local_diary(entry, game, missions)


def generate_openai_diary(
    entry: Entry,
    game: Game,
    missions: list[DiaryMission],
) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    payload = {
        "model": os.getenv("OPENAI_DIARY_MODEL", DEFAULT_DIARY_MODEL),
        "input": [
            {
                "role": "system",
                "content": (
                    "너는 KBO 직관 기록 앱 Ballog의 다이어리 작가야. "
                    "사용자가 남긴 메모를 가장 중요하게 살리고, 없는 내용을 지어내지 마. "
                    "한국어로 2~4문장, 담백하지만 감정이 남는 일기체로 작성해. "
                    "상투적인 첫 문장과 과한 감탄사는 피하고, 결과만 요약하지 마."
                ),
            },
            {
                "role": "user",
                "content": build_diary_prompt(entry, game, missions),
            },
        ],
        "max_output_tokens": 260,
        "temperature": 0.85,
    }

    request = urllib.request.Request(
        os.getenv("OPENAI_API_BASE_URL", OPENAI_RESPONSES_URL),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError, OSError):
        return None

    diary_text = extract_response_text(response_payload)
    if not diary_text:
        return None

    return normalize_diary_text(diary_text)


def build_diary_prompt(entry: Entry, game: Game, missions: list[DiaryMission]) -> str:
    score = "아직 점수 정보 없음"
    if game.home_score is not None and game.away_score is not None:
        score = f"{game.home_team} {game.home_score} : {game.away_score} {game.away_team}"

    is_win = calculate_is_win(entry, game)
    result = "승패 미정"
    if is_win is True:
        result = f"{entry.watched_team} 승리"
    elif is_win is False:
        result = f"{entry.watched_team} 패배"

    mission_lines = [
        f"- {mission.title}: {'성공' if mission.is_completed else '미완료'}"
        for mission in missions
    ]
    mission_text = "\n".join(mission_lines) if mission_lines else "없음"

    return "\n".join(
        [
            f"경기 날짜: {format_game_date(game.game_date)}",
            f"구장: {game.venue or '정보 없음'}",
            f"응원한 팀: {entry.watched_team}",
            f"경기: {game.home_team} vs {game.away_team}",
            f"점수: {score}",
            f"결과: {result}",
            f"사용자 메모: {entry.memo.strip() if entry.memo else '없음'}",
            "미션:",
            mission_text,
            "",
            "위 정보만 바탕으로 직관 일기를 써줘.",
        ]
    )


def extract_response_text(response_payload: dict) -> str | None:
    output_text = response_payload.get("output_text")
    if isinstance(output_text, str):
        return output_text

    chunks: list[str] = []
    for item in response_payload.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)

    return " ".join(chunks) if chunks else None


def normalize_diary_text(text: str) -> str:
    lines = [line.strip(" -\t") for line in text.splitlines()]
    normalized = " ".join(line for line in lines if line)
    return " ".join(normalized.split())


def generate_local_diary(entry: Entry, game: Game, missions: list[DiaryMission]) -> str:
    is_win = calculate_is_win(entry, game)
    opponent = game.away_team if entry.watched_team == game.home_team else game.home_team
    memo_text = entry.memo.strip() if entry.memo else None
    completed_missions = [mission.title for mission in missions if mission.is_completed]

    seed = stable_seed(
        entry.watched_team,
        game.home_team,
        game.away_team,
        str(game.game_date),
        memo_text or "",
        ",".join(mission.title for mission in missions),
    )

    opening_options = [
        f"{format_game_date(game.game_date)} {entry.watched_team}를 응원하러 간 길은 평소보다 조금 더 선명하게 느껴졌다.",
        f"{opponent}를 만나는 날이라 그런지, 경기장에 도착하기 전부터 마음이 먼저 달려가 있었다.",
        f"오늘 직관은 {entry.watched_team} 이름을 마음속으로 몇 번이나 되뇌며 시작됐다.",
        f"구장에 앉아 {entry.watched_team} 유니폼 색을 바라보는 순간, 하루의 리듬이 야구 쪽으로 기울었다.",
    ]
    opening = choose(seed, opening_options)

    middle_options = build_local_middle_options(entry, game, opponent, memo_text, completed_missions)
    middle = choose(seed // 7, middle_options)

    closing_options = {
        True: [
            "이긴 경기라 발걸음까지 가벼웠고, 오늘의 함성은 꽤 오래 남을 것 같다.",
            "마지막에는 웃으면서 일어날 수 있어서, 응원한 시간이 고스란히 보상받은 기분이었다.",
            "승리 덕분에 사소한 장면들까지 좋은 기억으로 묶여 집까지 따라왔다.",
        ],
        False: [
            "아쉬움은 남았지만, 그래도 이런 하루까지 쌓여서 팬의 시간이 되는 것 같다.",
            "결과는 쓰렸지만 현장에서 함께 버틴 마음만큼은 쉽게 식지 않았다.",
            "지는 날의 공기도 분명히 기억에 남아서, 다음 경기를 더 기다리게 만들었다.",
        ],
        None: [
            "승패보다도 오늘의 공기와 소리가 먼저 떠오르는 하루로 남을 것 같다.",
            "결과가 또렷하지 않아도, 직접 보고 들은 순간들만으로 충분히 기록하고 싶은 날이었다.",
            "오늘의 장면들은 점수보다 조금 느리게, 오래 마음에 남을 것 같다.",
        ],
    }
    closing = choose(seed // 13, closing_options[is_win])

    return " ".join([opening, middle, closing])


def build_local_middle_options(
    entry: Entry,
    game: Game,
    opponent: str,
    memo_text: str | None,
    completed_missions: list[str],
) -> list[str]:
    score_text = None
    if game.home_score is not None and game.away_score is not None:
        score_text = f"{game.home_team}와 {game.away_team}가 {game.home_score}대 {game.away_score}로 맞섰다"

    options: list[str] = []
    if memo_text and score_text:
        options.append(f"{score_text}; 그중에서도 '{memo_text}'라는 순간이 제일 먼저 떠오른다.")
        options.append(f"스코어가 움직이는 동안에도 내 기억은 자꾸 '{memo_text}' 쪽에 머물렀다.")
    elif memo_text:
        options.append(f"자세한 점수보다도 '{memo_text}'라는 기억이 오늘을 설명해주는 문장처럼 남았다.")
        options.append(f"경기 흐름을 다 적지 못해도 '{memo_text}'만큼은 놓치고 싶지 않았다.")
    elif score_text:
        options.append(f"{score_text}; {opponent}전 특유의 긴장감 때문에 평범한 이닝도 쉽게 지나가지 않았다.")
        options.append(f"{score_text}; 숫자로는 짧게 보이지만 현장에서는 매 순간이 꽤 길었다.")
    else:
        options.append(f"{game.home_team}와 {game.away_team}가 마주 선 그 분위기만으로도 충분히 집중하게 됐다.")
        options.append(f"{opponent}를 상대하는 경기라 작은 플레이 하나에도 눈이 오래 머물렀다.")

    if completed_missions:
        mission_text = ", ".join(completed_missions[:2])
        options.append(f"중간중간 '{mission_text}' 미션까지 챙기다 보니, 오늘 기록이 더 내 것처럼 느껴졌다.")

    return options


def stable_seed(*values: str) -> int:
    source = "|".join(values)
    return int(hashlib.sha256(source.encode("utf-8")).hexdigest()[:12], 16)


def choose(seed: int, options: list[str]) -> str:
    return options[seed % len(options)]


def format_game_date(value: datetime | None) -> str:
    if value is None:
        return "오늘"
    return f"{value.year}년 {value.month}월 {value.day}일"
