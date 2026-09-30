from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..content import CONSENT_VERSION
from ..db import get_db
from ..models import DeletionLog, InviteCode, Participant, RawEntry, iso
from ..security import new_code, require_admin
from .consent import current_toggles
from .me import export_participant

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class InvitesIn(BaseModel):
    count: int = Field(default=1, ge=1, le=50)
    note: str = Field(default="", max_length=200)


@router.post("/invites", status_code=201)
def create_invites(body: InvitesIn, db: Session = Depends(get_db)):
    codes = [InviteCode(code=new_code(), note=body.note) for _ in range(body.count)]
    db.add_all(codes)
    db.commit()
    return [{"code": c.code, "note": c.note} for c in codes]


@router.get("/invites")
def list_invites(db: Session = Depends(get_db)):
    rows = db.scalars(select(InviteCode).order_by(InviteCode.created_at.desc()))
    return [{"code": c.code, "note": c.note, "created_at": iso(c.created_at),
             "redeemed_at": iso(c.redeemed_at)} for c in rows]


@router.get("/participants")
def list_participants(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(RawEntry.participant_id, func.count()).group_by(RawEntry.participant_id)).all())
    out = []
    for p in db.scalars(select(Participant).order_by(Participant.created_at)):
        out.append({
            "id": p.id,
            "nickname": p.nickname,
            "created_at": iso(p.created_at),
            "consent_current": p.consent_version == CONSENT_VERSION,
            "toggles": current_toggles(db, p.id),
            "raw_entries": counts.get(p.id, 0),
        })
    return out


@router.get("/export")
def export_all(db: Session = Depends(get_db)):
    """Full dataset for offline analysis. Filter by each participant's toggles before any use."""
    return {
        "consent_version": CONSENT_VERSION,
        "participants": [export_participant(db, p) for p in db.scalars(select(Participant))],
        "deletions": [{"participant_ref": d.participant_ref, "raw_rows": d.raw_rows,
                       "deleted_at": iso(d.deleted_at)} for d in db.scalars(select(DeletionLog))],
    }
