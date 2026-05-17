import argparse
import csv
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from app.core.database import Base, SessionLocal, engine
from app.models.game import Game


TEAM_NAMES = {
    "LG": "LG 트윈스",
    "두산": "두산 베어스",
    "SSG": "SSG 랜더스",
    "키움": "키움 히어로즈",
    "KT": "KT 위즈",
    "삼성": "삼성 라이온즈",
    "롯데": "롯데 자이언츠",
    "KIA": "KIA 타이거즈",
    "한화": "한화 이글스",
    "NC": "NC 다이노스",
}

STADIUM_NAMES = {
    "잠실": "잠실야구장",
    "문학": "인천 SSG 랜더스필드",
    "고척": "고척스카이돔",
    "수원": "수원 KT 위즈파크",
    "대구": "대구 삼성라이온즈파크",
    "사직": "부산 사직야구장",
    "광주": "광주 KIA 챔피언스필드",
    "대전": "대전 한화생명 볼파크",
    "창원": "창원 NC 파크",
}

GAME_PATTERN = re.compile(
    r"^(?P<away>[A-Z가-힣]+?)(?P<away_score>\d+)?vs(?P<home_score>\d+)?(?P<home>[A-Z가-힣]+)$"
)
REQUIRED_COLUMNS = {"date", "time", "game", "stadium", "note"}


@dataclass
class ImportErrorDetail:
    line_number: int
    message: str


@dataclass
class ImportScheduleResult:
    created_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    errors: list[ImportErrorDetail] = field(default_factory=list)


def parse_date(raw_date: str, raw_time: str, year: int) -> datetime:
    month_day = raw_date.split("(", 1)[0]
    month_text, day_text = month_day.split(".", 1)
    hour_text, minute_text = raw_time.split(":", 1)
    return datetime(
        year,
        int(month_text),
        int(day_text),
        int(hour_text),
        int(minute_text),
    )


def parse_game(raw_game: str) -> tuple[str, str, int | None, int | None]:
    match = GAME_PATTERN.match(raw_game.strip())
    if not match:
        raise ValueError(f"Unsupported game format: {raw_game}")

    away_key = match.group("away")
    home_key = match.group("home")

    if away_key not in TEAM_NAMES or home_key not in TEAM_NAMES:
        raise ValueError(f"Unknown team in game: {raw_game}")

    away_score = match.group("away_score")
    home_score = match.group("home_score")

    return (
        TEAM_NAMES[away_key],
        TEAM_NAMES[home_key],
        int(away_score) if away_score is not None else None,
        int(home_score) if home_score is not None else None,
    )


def get_status(note: str, away_score: int | None, home_score: int | None) -> str:
    if note and note != "-":
        return note
    if away_score is not None and home_score is not None:
        return "경기 종료"
    return "경기 예정"


def validate_headers(fieldnames: list[str] | None) -> None:
    if not fieldnames:
        raise ValueError("CSV header is missing.")

    missing_columns = REQUIRED_COLUMNS - set(fieldnames)
    if missing_columns:
        missing_text = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required CSV columns: {missing_text}")


def import_schedule(
    csv_path: Path,
    year: int,
    *,
    dry_run: bool = False,
    strict: bool = False,
) -> ImportScheduleResult:
    if engine is None or SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured.")

    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    Base.metadata.create_all(bind=engine)

    with csv_path.open(encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        validate_headers(reader.fieldnames)
        rows = list(reader)

    result = ImportScheduleResult()

    with SessionLocal() as db:
        for index, row in enumerate(rows, start=2):
            try:
                game_date = parse_date(row["date"], row["time"], year)
                away_team, home_team, away_score, home_score = parse_game(row["game"])
                stadium = STADIUM_NAMES.get(row["stadium"], row["stadium"])
                status = get_status(row["note"], away_score, home_score)
            except (KeyError, TypeError, ValueError) as error:
                result.skipped_count += 1
                result.errors.append(
                    ImportErrorDetail(line_number=index, message=str(error))
                )
                continue

            existing_game = (
                db.query(Game)
                .filter(
                    Game.game_date == game_date,
                    Game.venue == stadium,
                    Game.home_team == home_team,
                    Game.away_team == away_team,
                )
                .first()
            )

            if existing_game:
                existing_game.home_score = home_score
                existing_game.away_score = away_score
                existing_game.status = status
                result.updated_count += 1
                continue

            db.add(
                Game(
                    game_date=game_date,
                    venue=stadium,
                    home_team=home_team,
                    away_team=away_team,
                    home_score=home_score,
                    away_score=away_score,
                    status=status,
                )
            )
            result.created_count += 1

        if strict and result.errors:
            db.rollback()
            error_count = len(result.errors)
            raise ValueError(f"Failed to import schedule: {error_count} invalid rows.")

        if dry_run:
            db.rollback()
        else:
            db.commit()

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Import 2026 KBO schedule CSV into games.")
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    result = import_schedule(
        args.csv_path,
        args.year,
        dry_run=args.dry_run,
        strict=args.strict,
    )
    print(
        f"created={result.created_count} "
        f"updated={result.updated_count} "
        f"skipped={result.skipped_count}"
    )
    for error in result.errors:
        print(f"line={error.line_number} error={error.message}")


if __name__ == "__main__":
    main()
