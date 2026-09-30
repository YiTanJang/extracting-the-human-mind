from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..config import Settings
from ..db import get_db
from ..models import InviteCode, Participant, now
from ..security import (
    client_key,
    current_participant,
    end_session,
    new_code,
    normalize_code,
    settings_of,
    sha256,
    start_session,
)
from .me import me_payload

router = APIRouter(prefix="/auth", tags=["auth"])


class RedeemIn(BaseModel):
    code: str = Field(min_length=4, max_length=32)
    nickname: str = Field(min_length=1, max_length=40)
    age_confirmed: bool


class ResumeIn(BaseModel):
    recovery_code: str = Field(min_length=4, max_length=40)


def _find_invite(db: Session, code: str) -> InviteCode | None:
    wanted = normalize_code(code)
    # Codes are stored in display form (with dashes); compare normalized.
    for invite in db.query(InviteCode).filter(InviteCode.redeemed_at.is_(None)):
        if normalize_code(invite.code) == wanted:
            return invite
    return None


@router.post("/redeem")
def redeem(
    body: RedeemIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(settings_of),
):
    request.app.state.auth_limiter.check(client_key(request))
    if not body.age_confirmed:
        raise HTTPException(400, "age_confirmation_required")
    invite = _find_invite(db, body.code)
    if invite is None:
        raise HTTPException(400, "invalid_invite_code")

    recovery = new_code(groups=4)
    participant = Participant(
        nickname=body.nickname.strip(), invite_code=invite.code, recovery_hash=sha256(normalize_code(recovery))
    )
    invite.redeemed_at = now()
    db.add(participant)
    db.flush()
    start_session(db, response, settings, participant)
    db.commit()
    # The recovery code is shown exactly once; only its hash is stored.
    return {"recovery_code": recovery, "me": me_payload(db, participant)}


@router.post("/resume")
def resume(
    body: ResumeIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(settings_of),
):
    request.app.state.auth_limiter.check(client_key(request))
    participant = (
        db.query(Participant).filter(Participant.recovery_hash == sha256(normalize_code(body.recovery_code))).first()
    )
    if participant is None:
        raise HTTPException(400, "invalid_recovery_code")
    start_session(db, response, settings, participant)
    db.commit()
    return {"me": me_payload(db, participant)}


@router.post("/recovery-code")
def rotate_recovery_code(participant: Participant = Depends(current_participant), db: Session = Depends(get_db)):
    """Issue a new recovery code (the old one stops working)."""
    recovery = new_code(groups=4)
    participant.recovery_hash = sha256(normalize_code(recovery))
    db.commit()
    return {"recovery_code": recovery}


@router.post("/logout")
def logout(
    request: Request, response: Response, db: Session = Depends(get_db), settings: Settings = Depends(settings_of)
):
    end_session(db, request, response, settings)
    db.commit()
    return {"ok": True}
