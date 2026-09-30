import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.content import CONSENT_VERSION
from app.main import create_app

ADMIN = {"Authorization": "Bearer test-admin"}


@pytest.fixture
def app():
    return create_app(Settings(database_url="sqlite://", admin_token="test-admin", cookie_secure=False))


@pytest.fixture
def admin(app):
    return TestClient(app, headers=ADMIN)


def new_client(app) -> TestClient:
    return TestClient(app)


def invite(admin, note="friend") -> str:
    res = admin.post("/api/admin/invites", json={"count": 1, "note": note})
    assert res.status_code == 201
    return res.json()[0]["code"]


def join(app, admin, nickname="토끼", agree=True, toggles=None):
    client = new_client(app)
    res = client.post("/api/auth/redeem", json={"code": invite(admin), "nickname": nickname, "age_confirmed": True})
    assert res.status_code == 200, res.text
    recovery = res.json()["recovery_code"]
    if agree:
        res = client.post("/api/consent/agree", json={"version": CONSENT_VERSION, "toggles": toggles or {}})
        assert res.status_code == 200, res.text
    return client, recovery


def test_health(app):
    assert new_client(app).get("/api/health").json()["ok"] is True


def test_admin_requires_token(app):
    client = new_client(app)
    assert client.get("/api/admin/invites").status_code == 401
    assert client.get("/api/admin/invites", headers={"Authorization": "Bearer nope"}).status_code == 401
    disabled = create_app(Settings(database_url="sqlite://", admin_token="", cookie_secure=False))
    assert TestClient(disabled).get("/api/admin/invites", headers=ADMIN).status_code == 404


def test_redeem_validation(app, admin):
    client = new_client(app)
    code = invite(admin)
    assert client.post("/api/auth/redeem", json={"code": code, "nickname": "a", "age_confirmed": False}).status_code == 400
    assert client.post("/api/auth/redeem", json={"code": "XXXX-XXXX-XXXX", "nickname": "a",
                                                 "age_confirmed": True}).status_code == 400
    # Codes are accepted without dashes and in lower case.
    loose = code.replace("-", "").lower()
    assert client.post("/api/auth/redeem", json={"code": loose, "nickname": "a", "age_confirmed": True}).status_code == 200
    # Single use.
    other = new_client(app)
    assert other.post("/api/auth/redeem", json={"code": code, "nickname": "b", "age_confirmed": True}).status_code == 400


def test_consent_gates_raw_and_toggles_default_off(app, admin):
    client, _ = join(app, admin, agree=False)
    me = client.get("/api/me").json()
    assert me["consent"]["is_current"] is False
    assert set(me["consent"]["toggles"].values()) == {False}
    assert client.post("/api/raw", json={"module": "free_writing", "payload": {"text": "x"}}).status_code == 403
    assert client.post("/api/consent/agree", json={"version": "stale", "toggles": {}}).status_code == 409
    res = client.post("/api/consent/agree", json={"version": CONSENT_VERSION, "toggles": {"validation": True}})
    assert res.json()["toggles"] == {"analysis": False, "simulation": False, "validation": True,
                                     "research_harvest": False}
    assert client.post("/api/raw", json={"module": "free_writing", "payload": {"text": "x"}}).status_code == 201


def test_toggle_history_is_append_only(app, admin):
    client, _ = join(app, admin, toggles={"analysis": True})
    client.put("/api/consent/toggles", json={"purpose": "analysis", "granted": False})
    client.put("/api/consent/toggles", json={"purpose": "analysis", "granted": False})  # no-op, no new event
    events = client.get("/api/me/export").json()["consent_events"]
    assert [(e["purpose"], e["granted"]) for e in events] == [("analysis", True), ("analysis", False)]


def test_raw_is_verbatim_and_append_only(app, admin):
    client, _ = join(app, admin)
    text = "  그날 밤, 상사가…\n두 번째 줄  "
    res = client.post("/api/raw", json={"module": "ccrt", "item": "episode_1", "payload": {"raw_wish": text},
                                        "domain_tag": "work", "client_meta": {"ms_on_page": 1200}})
    assert res.status_code == 201
    entry_id = res.json()["id"]
    rows = client.get("/api/raw", params={"module": "ccrt"}).json()
    assert rows[0]["payload"]["raw_wish"] == text  # untouched, whitespace included
    assert client.put(f"/api/raw/{entry_id}", json={}).status_code in (404, 405)
    assert client.delete(f"/api/raw/{entry_id}").status_code in (404, 405)
    assert client.post("/api/raw", json={"module": "ccrt", "payload": {}, "domain_tag": "bogus"}).status_code == 422
    assert client.post("/api/raw", json={"module": "../etc", "payload": {}}).status_code == 422


def test_drafts_resume_and_clear_on_submit(app, admin):
    client, _ = join(app, admin)
    client.put("/api/drafts/feared_self", json={"payload": {"step": 2, "text": "반쯤"}})
    assert client.get("/api/drafts/feared_self").json()["payload"]["step"] == 2
    client.post("/api/raw", json={"module": "feared_self", "payload": {"text": "완성"}})
    assert client.get("/api/drafts/feared_self").status_code == 404


def test_recovery_code_logs_in_on_another_device(app, admin):
    client, recovery = join(app, admin, nickname="여우")
    phone = new_client(app)
    assert phone.get("/api/me").status_code == 401
    res = phone.post("/api/auth/resume", json={"recovery_code": recovery.lower()})
    assert res.status_code == 200 and res.json()["me"]["nickname"] == "여우"
    rotated = client.post("/api/auth/recovery-code").json()["recovery_code"]
    assert new_client(app).post("/api/auth/resume", json={"recovery_code": recovery}).status_code == 400
    assert new_client(app).post("/api/auth/resume", json={"recovery_code": rotated}).status_code == 200


def test_logout_ends_session(app, admin):
    client, _ = join(app, admin)
    client.post("/api/auth/logout")
    assert client.get("/api/me").status_code == 401


def test_hard_delete(app, admin):
    client, recovery = join(app, admin, toggles={"validation": True})
    client.post("/api/raw", json={"module": "free_writing", "payload": {"text": "민감한 내용"}})
    client.post("/api/raw", json={"module": "free_writing", "item": "part_2", "payload": {"text": "더"}})
    assert client.post("/api/me/delete", json={"confirm": "delete"}).status_code == 400
    res = client.post("/api/me/delete", json={"confirm": "삭제"})
    assert res.json() == {"deleted": True, "raw_rows": 2}
    assert client.get("/api/me").status_code == 401
    assert new_client(app).post("/api/auth/resume", json={"recovery_code": recovery}).status_code == 400
    dump = admin.get("/api/admin/export").json()
    assert dump["participants"] == []
    assert dump["deletions"][0]["raw_rows"] == 2
    assert "민감한" not in str(dump)


def test_admin_export_includes_toggles(app, admin):
    join(app, admin, nickname="곰", toggles={"validation": True})
    people = admin.get("/api/admin/participants").json()
    assert people[0]["nickname"] == "곰" and people[0]["toggles"]["validation"] is True
