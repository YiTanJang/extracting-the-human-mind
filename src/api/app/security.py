import hashlib
import hmac
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .content import CONSENT_VERSION
from .db import get_db
from .models import AuthSession, Participant, now

# Unambiguous alphabet for codes people type from a chat message (no 0/O, 1/I/L).
_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def settings_of(request: Request) -> Settings:
    return request.app.state.settings


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def new_code(groups: int = 3, size: int = 4) -> str:
    """e.g. 'K7QX-M3PA-W9RT' — 12 chars from a 31-symbol alphabet ≈ 59 bits."""
    return "-".join("".join(secrets.choice(_CODE_ALPHABET) for _ in range(size)) for _ in range(groups))


def normalize_code(code: str) -> str:
    return "".join(ch for ch in code.upper() if ch.isalnum())


def start_session(db: Session, response: Response, settings: Settings, participant: Participant) -> None:
    token = secrets.token_urlsafe(32)
    expires = now() + timedelta(days=settings.session_days)
    db.add(AuthSession(token_hash=sha256(token), participant_id=participant.id, expires_at=expires))
    response.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.session_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def end_session(db: Session, request: Request, response: Response, settings: Settings) -> None:
    token = request.cookies.get(settings.cookie_name)
    if token:
        session = db.get(AuthSession, sha256(token))
        if session:
            db.delete(session)
    response.delete_cookie(settings.cookie_name, path="/")


def current_participant(
    request: Request, db: Session = Depends(get_db), settings: Settings = Depends(settings_of)
) -> Participant:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(401, "login_required")
    session = db.get(AuthSession, sha256(token))
    if session is None or _aware(session.expires_at) < now():
        raise HTTPException(401, "login_required")
    participant = db.get(Participant, session.participant_id)
    if participant is None:
        raise HTTPException(401, "login_required")
    return participant


def consented_participant(participant: Participant = Depends(current_participant)) -> Participant:
    if participant.consent_version != CONSENT_VERSION:
        raise HTTPException(403, "consent_required")
    return participant


def require_admin(request: Request, settings: Settings = Depends(settings_of)) -> None:
    if not settings.admin_token:
        raise HTTPException(404)
    header = request.headers.get("authorization", "")
    supplied = header.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied.encode(), settings.admin_token.encode()):
        raise HTTPException(401, "admin_token_invalid")


def _aware(dt: datetime) -> datetime:
    # SQLite drops tzinfo on read; stored values are always UTC.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class RateLimiter:
    """Small in-process limiter for code redemption. Single API replica, so memory is enough."""

    def __init__(self, limit: int, window_s: float) -> None:
        self.limit, self.window = limit, window_s
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        t = time.monotonic()
        q = self.hits[key]
        while q and t - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(429, "too_many_attempts")
        q.append(t)


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
