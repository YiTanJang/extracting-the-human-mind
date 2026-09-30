from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..content import CONSENT_VERSION, PURPOSES, consent_payload
from ..db import get_db
from ..models import ConsentEvent, Participant, now
from ..security import current_participant

router = APIRouter(prefix="/consent", tags=["consent"])


def current_toggles(db: Session, participant_id: str) -> dict[str, bool]:
    """Latest event per purpose; purposes never toggled are off (default: all off)."""
    state = {key: False for key in PURPOSES}
    events = db.scalars(
        select(ConsentEvent).where(ConsentEvent.participant_id == participant_id).order_by(ConsentEvent.id)
    )
    for event in events:
        if event.purpose in state:
            state[event.purpose] = event.granted
    return state


class AgreeIn(BaseModel):
    version: str
    toggles: dict[str, bool] = {}


class ToggleIn(BaseModel):
    purpose: str
    granted: bool


@router.get("")
def get_consent():
    return consent_payload()


@router.post("/agree")
def agree(body: AgreeIn, participant: Participant = Depends(current_participant), db: Session = Depends(get_db)):
    if body.version != CONSENT_VERSION:
        raise HTTPException(409, "consent_version_changed")
    unknown = set(body.toggles) - set(PURPOSES)
    if unknown:
        raise HTTPException(400, f"unknown_purpose: {sorted(unknown)}")
    participant.consent_version = CONSENT_VERSION
    participant.consented_at = now()
    before = current_toggles(db, participant.id)
    for purpose, granted in body.toggles.items():
        if before[purpose] != granted:
            db.add(ConsentEvent(participant_id=participant.id, purpose=purpose, granted=granted,
                                consent_version=CONSENT_VERSION))
    db.commit()
    return {"toggles": current_toggles(db, participant.id)}


@router.put("/toggles")
def set_toggle(body: ToggleIn, participant: Participant = Depends(current_participant), db: Session = Depends(get_db)):
    if body.purpose not in PURPOSES:
        raise HTTPException(400, "unknown_purpose")
    if participant.consent_version != CONSENT_VERSION:
        raise HTTPException(403, "consent_required")
    if current_toggles(db, participant.id)[body.purpose] != body.granted:
        db.add(ConsentEvent(participant_id=participant.id, purpose=body.purpose, granted=body.granted,
                            consent_version=CONSENT_VERSION))
        db.commit()
    return {"toggles": current_toggles(db, participant.id)}
