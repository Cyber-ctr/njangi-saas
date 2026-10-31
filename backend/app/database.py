from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# Allow both psycopg (psycopg3) and psycopg2 drivers. SQLAlchemy detects
# the DBAPI from the URL scheme. If `psycopg` is not importable but
# `psycopg2` is installed, patch the URL to use the psycopg2 driver.
db_url = settings.database_url
try:
    import psycopg  # type: ignore
except ModuleNotFoundError as error:
    if error.name != "psycopg":
        raise
    # if a postgres URL uses `psycopg` (psycopg3) but the runtime has
    # only psycopg2, rewrite the scheme to `postgresql+psycopg2://`.
    if db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://")

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
