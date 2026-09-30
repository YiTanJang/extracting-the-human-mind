from collections.abc import Iterator
from pathlib import Path

from fastapi import Request
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str) -> Engine:
    if not url.startswith("sqlite"):
        return create_engine(url, pool_pre_ping=True)

    if url in ("sqlite://", "sqlite:///:memory:"):
        # In-memory database for tests: one shared connection.
        engine = create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    else:
        Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _record):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA busy_timeout=5000")
        cur.close()

    return engine


def get_db(request: Request) -> Iterator[Session]:
    with request.app.state.sessionmaker() as db:
        yield db
