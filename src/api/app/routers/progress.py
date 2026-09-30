from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..battery import ARMS, SEQUENCE
from ..db import get_db
from ..models import Draft, ModuleCompletion, Participant, RawEntry, iso
from ..security import consented_participant
from .raw import require_writable

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("")
def get_progress(participant: Participant = Depends(consented_participant), db: Session = Depends(get_db)):
    """The participant's sequence with a status per module: done / available / locked."""
    done = {c.module: c.completed_at for c in
            db.scalars(select(ModuleCompletion).where(ModuleCompletion.participant_id == participant.id))}
    counts = dict(db.execute(
        select(RawEntry.module, func.count()).where(RawEntry.participant_id == participant.id).group_by(RawEntry.module)
    ).all())
    drafts = set(db.scalars(select(Draft.module).where(Draft.participant_id == participant.id)))

    steps, open_found = [], False
    for module in SEQUENCE:
        if module in done:
            status = "done"
        elif not open_found:
            status, open_found = "available", True
        else:
            status = "locked"
        steps.append({
            "module": module,
            "stage": "arm" if module in ARMS else "battery",
            "status": status,
            "entries": counts.get(module, 0),
            "has_draft": module in drafts,
            "completed_at": iso(done.get(module)),
        })
    return {"steps": steps, "all_done": len(done) >= len(SEQUENCE)}


@router.post("/{module}/complete")
def complete(module: str, participant: Participant = Depends(consented_participant), db: Session = Depends(get_db)):
    require_writable(db, participant, module)
    has_entries = db.scalar(select(func.count()).select_from(RawEntry).where(
        RawEntry.participant_id == participant.id, RawEntry.module == module))
    if not has_entries:
        raise HTTPException(409, "no_entries")
    db.add(ModuleCompletion(participant_id=participant.id, module=module))
    draft = db.get(Draft, (participant.id, module))
    if draft is not None:
        db.delete(draft)
    db.commit()
    return {"module": module, "status": "done"}
