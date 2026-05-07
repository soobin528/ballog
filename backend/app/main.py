from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.core.database import Base, engine
from app.models import Entry, EntryMission, Game, User  # noqa: F401
from app.routers.entry_router import router as entry_router
from app.routers.game_router import router as game_router
from app.routers.user_router import router as user_router

STATIC_DIR = Path(__file__).resolve().parent / "static"


def create_tables():
    if engine is None:
        return

    try:
        Base.metadata.create_all(bind=engine)
        ensure_user_profile_columns()
    except Exception:
        pass


def ensure_user_profile_columns():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    profile_columns = {
        "fan_since_year": "INTEGER",
        "favorite_player": "VARCHAR(100)",
        "home_stadium": "VARCHAR(255)",
    }

    with engine.begin() as connection:
        for column_name, column_type in profile_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                )


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.include_router(user_router)
app.include_router(game_router)
app.include_router(entry_router)


@app.get("/")
def read_root():
    return {"message": "Ballog API running"}
