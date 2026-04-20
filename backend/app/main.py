from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import Entry, EntryMission, Game, User  # noqa: F401


def create_tables():
    if engine is None:
        return

    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def read_root():
    return {"message": "Ballog API running"}
