# app/core/db.py
from __future__ import annotations

from typing import Generator, Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings


Base = declarative_base()


# Engine (sync)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency: yields a DB session and guarantees close().
    Usage:
        def endpoint(db: Session = Depends(get_db)): ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Optional helper to create tables in a dev environment.
    In production use Alembic migrations.
    """
    # from app import models  # ensure models are imported if you plan to use create_all
    # Base.metadata.create_all(bind=engine)
    return
