import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..battery import SEQUENCE, prerequisite
from ..db import get_db
from ..models import Draft, ModuleCompletion, Participant, RawEntry, iso, now
from ..security import consented_participant

router = APIRouter(tags=["raw"])

_ID = re.compile(r"^[a-z0-9_]{2,64}$")
# Items are stimulus/card ids inside a module; docs use ids like "A-romantic", so case and hyphens are allowed.
_ITEM = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")
DOMAINS = {"work", "relation", "self", "general"}


def _check_id(value: str, what: str, pattern: re.Pattern = _ID) -> str:
    if not pattern.match(value):
        raise ValueError(f"invalid {what}")
    return value


class RawIn(BaseModel):
    module: str
    item: str = Field(default="main")
    payload: dict
    domain_tag: str | None = None
    client_meta: dict = {}

    @field_validator("module")
    @classmethod
    def _module(cls, v: str) -> str:
        return _check_id(v, "module")

    @field_validator("item")
    @classmethod
    def _item(cls, v: str) -> str:
        return _check_id(v, "item", _ITEM)

    @field_validator("domain_tag")
    @classmethod
    def _domain(cls, v: str | None) -> str | None:
        if v is not None and v not in DOMAINS:
            raise ValueError("invalid domain_tag")
        return v


class DraftIn(BaseModel):
    payload: dict


def require_writable(db: Session, participant: Participant, module: str) -> None:
    """Enforce the fixed sequence: known module, predecessor finished, module itself not yet finished."""
    if module not in SEQUENCE:
        raise HTTPException(404, "unknown_module")
    before = prerequisite(module)
    if before is not None and db.get(ModuleCompletion, (participant.id, before)) is None:
        raise HTTPException(409, "module_locked")
    if db.get(ModuleCompletion, (participant.id, module)) is not None:
        raise HTTPException(409, "module_completed")


@router.post("/raw", status_code=201)
def append_raw(body: RawIn, participant: Participant = Depends(consented_participant), db: Session = Depends(get_db)):
    # Append-only: there is no update or per-row delete route for raw entries.
    require_writable(db, participant, body.module)
    entry = RawEntry(participant_id=participant.id, module=body.module, item=body.item, payload=body.payload,
                     domain_tag=body.domain_tag, client_meta=body.client_meta)
    db.add(entry)
    db.commit()
    return {"id": entry.id, "created_at": iso(entry.created_at)}


@router.get("/raw")
def list_raw(module: str | None = None, participant: Participant = Depends(consented_participant),
             db: Session = Depends(get_db)):
    query = select(RawEntry).where(RawEntry.participant_id == participant.id)
    if module:
        query = query.where(RawEntry.module == module)
    rows = db.scalars(query.order_by(RawEntry.created_at))
    return [{"id": r.id, "module": r.module, "item": r.item, "payload": r.payload, "domain_tag": r.domain_tag,
             "created_at": iso(r.created_at)} for r in rows]


@router.get("/drafts/{module}")
def get_draft(module: str, participant: Participant = Depends(consented_participant), db: Session = Depends(get_db)):
    draft = db.get(Draft, (participant.id, module))
    if draft is None:
        raise HTTPException(404)
    return {"module": module, "payload": draft.payload, "updated_at": iso(draft.updated_at)}


@router.put("/drafts/{module}")
def put_draft(module: str, body: DraftIn, participant: Participant = Depends(consented_participant),
              db: Session = Depends(get_db)):
    try:
        _check_id(module, "module")
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    draft = db.get(Draft, (participant.id, module))
    if draft is None:
        db.add(Draft(participant_id=participant.id, module=module, payload=body.payload))
    else:
        draft.payload = body.payload
        draft.updated_at = now()
    db.commit()
    return {"ok": True}


@router.delete("/drafts/{module}")
def delete_draft(module: str, participant: Participant = Depends(consented_participant),
                 db: Session = Depends(get_db)):
    draft = db.get(Draft, (participant.id, module))
    if draft is not None:
        db.delete(draft)
        db.commit()
    return {"ok": True}
