from fastapi import FastAPI
from sqlalchemy.orm import sessionmaker

from .config import Settings, get_settings
from .content import CONSENT_VERSION
from .db import Base, make_engine
from .security import RateLimiter
from .routers import admin, auth, consent, me, raw


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = make_engine(settings.database_url)
    # Pilot scale: create tables at startup. Switch to Alembic before the schema holds real participant data.
    Base.metadata.create_all(engine)

    docs = "/api/docs" if settings.expose_docs else None
    app = FastAPI(title="Extracting the Human Mind — pilot API", docs_url=docs, redoc_url=None,
                  openapi_url="/api/openapi.json" if settings.expose_docs else None)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = sessionmaker(engine, expire_on_commit=False)
    # Invite/recovery code attempts per client: 10 per 10 minutes.
    app.state.auth_limiter = RateLimiter(limit=10, window_s=600)

    for module in (auth, consent, me, raw, admin):
        app.include_router(module.router, prefix="/api")

    @app.get("/api/health")
    def health():
        return {"ok": True, "consent_version": CONSENT_VERSION}

    return app
