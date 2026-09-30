"""Pilot data model.

raw_entries is the raw store: append-only, verbatim, no interpretation fields
(extracting-the-human-mind/overview/principles.md §1-4). The only way rows leave
it is the participant's own hard delete (operations/experiment_ethics.md, 잊힐 권리).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def _id() -> str:
    return uuid.uuid4().hex


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime | None) -> str | None:
    """ISO 8601 with an explicit UTC offset. SQLite drops tzinfo on read; stored values are UTC."""
    if dt is None:
        return None
    return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).isoformat()


class InviteCode(Base):
    __tablename__ = "invite_codes"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    # Researcher-only memo (who the code was sent to). Not shown to participants.
    note: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    nickname: Mapped[str] = mapped_column(String(40))
    invite_code: Mapped[str] = mapped_column(String(32))
    recovery_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    consent_version: Mapped[str | None] = mapped_column(String(32))
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuthSession(Base):
    __tablename__ = "sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ConsentEvent(Base):
    """Append-only history of purpose toggles. Current state = latest event per purpose."""

    __tablename__ = "consent_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(32))
    granted: Mapped[bool] = mapped_column(Boolean)
    consent_version: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RawEntry(Base):
    __tablename__ = "raw_entries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), index=True)
    module: Mapped[str] = mapped_column(String(64), index=True)
    item: Mapped[str] = mapped_column(String(64))
    # The participant's words exactly as submitted.
    payload: Mapped[dict] = mapped_column(JSON)
    domain_tag: Mapped[str | None] = mapped_column(String(16))
    # Measurement metadata only (timings, stimulus id, UI version) — never interpretation.
    client_meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Draft(Base):
    """In-progress form state for resume. Not raw data; overwritten freely."""

    __tablename__ = "drafts"

    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True
    )
    module: Mapped[str] = mapped_column(String(64), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class ModuleCompletion(Base):
    """Process metadata: when a participant finished a module. Kept out of raw_entries so the raw store
    holds only the participant's own words."""

    __tablename__ = "module_completions"

    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True
    )
    module: Mapped[str] = mapped_column(String(64), primary_key=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DeletionLog(Base):
    """Proof that a deletion happened. Holds no psychological data."""

    __tablename__ = "deletion_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_ref: Mapped[str] = mapped_column(String(64))
    raw_rows: Mapped[int] = mapped_column(Integer)
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    note: Mapped[str] = mapped_column(Text, default="")
