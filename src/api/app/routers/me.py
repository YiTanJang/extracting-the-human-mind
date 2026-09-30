from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import Settings
from ..content import CONSENT_VERSION
from ..db import get_db
from ..models import iso, ConsentEvent, DeletionLog, Draft, Participant, RawEntry
from ..security import current_participant, end_session, settings_of, sha256
from .consent import current_toggles

router = APIRouter(prefix="/me", tags=["me"])

DELETE_CONFIRMATION = "삭제"


def me_payload(db: Session, participant: Participant) -> dict:
    return {
        "id": participant.id,
        "nickname": participant.nickname,
        "created_at": iso(participant.created_at),
        "consent": {
            "required_version": CONSENT_VERSION,
            "agreed_version": participant.consent_version,
            "agreed_at": iso(participant.consented_at),
            "is_current": participant.consent_version == CONSENT_VERSION,
            "toggles": current_toggles(db, participant.id),
        },
    }


def export_participant(db: Session, participant: Participant) -> dict:
    raw = db.scalars(select(RawEntry).where(RawEntry.participant_id == participant.id).order_by(RawEntry.created_at))
    events = db.scalars(
        select(ConsentEvent).where(ConsentEvent.participant_id == participant.id).order_by(ConsentEvent.id)
    )
    drafts = db.scalars(select(Draft).where(Draft.participant_id == participant.id))
    return {
        **me_payload(db, participant),
        "consent_events": [
            {"purpose": e.purpose, "granted": e.granted, "consent_version": e.consent_version,
             "at": iso(e.created_at)}
            for e in events
        ],
        "raw_entries": [
            {"id": r.id, "module": r.module, "item": r.item, "payload": r.payload, "domain_tag": r.domain_tag,
             "client_meta": r.client_meta, "created_at": iso(r.created_at)}
            for r in raw
        ],
        "drafts": [{"module": d.module, "payload": d.payload, "updated_at": iso(d.updated_at)} for d in drafts],
    }


class DeleteIn(BaseModel):
    confirm: str


@router.get("")
def get_me(participant: Participant = Depends(current_participant), db: Session = Depends(get_db)):
    return me_payload(db, participant)


@router.get("/export")
def export_me(participant: Participant = Depends(current_participant), db: Session = Depends(get_db)):
    return export_participant(db, participant)


@router.post("/delete")
def delete_me(
    body: DeleteIn,
    request: Request,
    response: Response,
    participant: Participant = Depends(current_participant),
    db: Session = Depends(get_db),
    settings: Settings = Depends(settings_of),
):
    """Hard delete (잊힐 권리). Everything keyed to this participant goes; only a hashed deletion record stays."""
    if body.confirm != DELETE_CONFIRMATION:
        raise HTTPException(400, "confirmation_mismatch")
    raw_rows = db.scalar(select(func.count()).select_from(RawEntry).where(RawEntry.participant_id == participant.id))
    end_session(db, request, response, settings)
    db.add(DeletionLog(participant_ref=sha256(participant.id), raw_rows=raw_rows or 0))
    db.delete(participant)  # sessions, consent events, raw entries, drafts cascade via FK
    db.commit()
    return {"deleted": True, "raw_rows": raw_rows or 0}
