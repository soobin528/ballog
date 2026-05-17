import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.game import Game
from app.schemas.entry_schema import EntryCreate, EntryMissionCreate
from app.schemas.game_schema import GameCreate, GameUpdate
from app.schemas.user_schema import UserCreate, UserUpdate
from app.services import entry_service, game_service, user_service
from scripts import import_kbo_schedule


class ServiceTestCase(unittest.TestCase):
    def setUp(self):
        os.environ.pop("OPENAI_API_KEY", None)
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()
        self.original_generate_ticket = entry_service.generate_ticket
        entry_service.generate_ticket = lambda entry, game: f"/static/tickets/ticket_{entry.id}.png"

    def tearDown(self):
        entry_service.generate_ticket = self.original_generate_ticket
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def create_user(self) -> dict:
        return user_service.create_user(
            self.db,
            UserCreate(
                email="fan@example.com",
                nickname="두산칸",
                favorite_team="두산 베어스",
            ),
        )

    def create_game(self) -> dict:
        return game_service.create_game(
            self.db,
            GameCreate(
                game_date=datetime(2026, 5, 15, 18, 30),
                stadium="잠실야구장",
                home_team="두산 베어스",
                away_team="LG 트윈스",
                home_score=5,
                away_score=3,
                status="경기 종료",
            ),
        )


class UserServiceTests(ServiceTestCase):
    def test_create_user_trims_text_fields(self):
        created = user_service.create_user(
            self.db,
            UserCreate(
                email="  user@example.com  ",
                nickname="  야구팬  ",
                favorite_team="  두산 베어스  ",
            ),
        )

        self.assertEqual(created["email"], "user@example.com")
        self.assertEqual(created["nickname"], "야구팬")
        self.assertEqual(created["favorite_team"], "두산 베어스")

    def test_update_user_rejects_invalid_fan_since_year(self):
        created = self.create_user()

        with self.assertRaises(HTTPException) as raised:
            user_service.update_user(
                self.db,
                created["id"],
                UserUpdate(fan_since_year=1800),
            )

        self.assertEqual(raised.exception.status_code, 400)


class GameServiceTests(ServiceTestCase):
    def test_create_game_upserts_existing_matchup(self):
        first = self.create_game()
        second = game_service.create_game(
            self.db,
            GameCreate(
                game_date=datetime(2026, 5, 15, 18, 30),
                stadium="잠실야구장",
                home_team="두산 베어스",
                away_team="LG 트윈스",
                home_score=6,
                away_score=4,
                status="수정",
            ),
        )

        self.assertEqual(first["id"], second["id"])
        self.assertEqual(second["home_score"], 6)
        self.assertEqual(second["status"], "수정")

    def test_create_game_rejects_same_team(self):
        with self.assertRaises(HTTPException) as raised:
            game_service.create_game(
                self.db,
                GameCreate(
                    game_date=datetime(2026, 5, 15, 18, 30),
                    stadium="잠실야구장",
                    home_team="두산 베어스",
                    away_team="두산 베어스",
                ),
            )

        self.assertEqual(raised.exception.status_code, 400)

    def test_update_game_rejects_negative_score(self):
        created = self.create_game()

        with self.assertRaises(HTTPException) as raised:
            game_service.update_game(
                self.db,
                created["id"],
                GameUpdate(home_score=-1),
            )

        self.assertEqual(raised.exception.status_code, 400)


class EntryServiceTests(ServiceTestCase):
    def test_create_entry_uses_local_diary_fallback_and_filters_blank_missions(self):
        user = self.create_user()
        game = self.create_game()

        created = entry_service.create_entry(
            self.db,
            EntryCreate(
                user_id=user["id"],
                game_id=game["id"],
                watched_team="두산 베어스",
                memo="9회 응원이 제일 기억남",
                missions=[
                    EntryMissionCreate(title="응원 포인트 남기기", is_completed=True),
                    EntryMissionCreate(title="   ", is_completed=True),
                ],
            ),
        )

        self.assertIn("두산 베어스", created["diary_text"])
        self.assertEqual(created["mission_success_count"], 1)
        self.assertEqual(len(created["missions"]), 1)

    def test_create_entry_rejects_manual_empty_diary(self):
        user = self.create_user()
        game = self.create_game()

        with self.assertRaises(HTTPException) as raised:
            entry_service.create_entry(
                self.db,
                EntryCreate(
                    user_id=user["id"],
                    game_id=game["id"],
                    watched_team="두산 베어스",
                    memo=" ",
                    diary_text=" ",
                    auto_generate_diary=False,
                ),
            )

        self.assertEqual(raised.exception.status_code, 400)


class ImportScheduleTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.original_engine = import_kbo_schedule.engine
        self.original_session_local = import_kbo_schedule.SessionLocal
        import_kbo_schedule.engine = self.engine
        import_kbo_schedule.SessionLocal = self.SessionLocal

    def tearDown(self):
        import_kbo_schedule.engine = self.original_engine
        import_kbo_schedule.SessionLocal = self.original_session_local
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def write_csv(self, content: str) -> Path:
        file = tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="", delete=False)
        with file:
            file.write(content)
        return Path(file.name)

    def test_import_schedule_reports_invalid_rows(self):
        csv_path = self.write_csv(
            "date,time,game,stadium,note\n"
            "5.15(금),18:30,LG3vs5두산,잠실,-\n"
            "5.16(토),18:30,UNKNOWN,잠실,-\n"
        )
        try:
            result = import_kbo_schedule.import_schedule(csv_path, 2026)
        finally:
            csv_path.unlink()

        self.assertEqual(result.created_count, 1)
        self.assertEqual(result.skipped_count, 1)
        self.assertEqual(result.errors[0].line_number, 3)

    def test_import_schedule_dry_run_rolls_back(self):
        csv_path = self.write_csv(
            "date,time,game,stadium,note\n"
            "5.15(금),18:30,LG3vs5두산,잠실,-\n"
        )
        try:
            result = import_kbo_schedule.import_schedule(csv_path, 2026, dry_run=True)
        finally:
            csv_path.unlink()

        with self.SessionLocal() as db:
            game_count = db.query(Game).count()

        self.assertEqual(result.created_count, 1)
        self.assertEqual(game_count, 0)


if __name__ == "__main__":
    unittest.main()
