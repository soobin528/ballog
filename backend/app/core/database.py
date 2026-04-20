import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
    if engine is not None
    else None
)
Base = declarative_base()


def get_db():
    if SessionLocal is None:
        raise RuntimeError("Database is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_db_connection():
    if engine is None:
        return False

    try:
        with engine.connect():
            return True
    except Exception:
        return False
