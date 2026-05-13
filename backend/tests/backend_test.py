"""
Backend API tests for FitStudio (Django + DRF).
Covers: auth, studios, exercises, classes (pipeline), admin, tenant isolation.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass

API = f"{BASE_URL}/api"

OWNER_EMAIL = "owner@lumen.studio"
OWNER_PASS = "Owner@12345"
ADMIN_EMAIL = "admin@fitstudio.ai"
ADMIN_PASS = "Admin@12345"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers["Content-Type"] = "application/json"
    return sess


def _login(s, email, password):
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def owner_token(s):
    return _login(s, OWNER_EMAIL, OWNER_PASS)["access"]


@pytest.fixture(scope="session")
def admin_token(s):
    return _login(s, ADMIN_EMAIL, ADMIN_PASS)["access"]


def hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- health ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- auth ----------
class TestAuth:
    def test_login_owner(self, s):
        data = _login(s, OWNER_EMAIL, OWNER_PASS)
        assert "access" in data and "refresh" in data
        assert data["user"]["email"] == OWNER_EMAIL
        assert data["user"]["studio"]["name"] == "Lumen Pilates"

    def test_login_admin(self, s):
        data = _login(s, ADMIN_EMAIL, ADMIN_PASS)
        assert data["user"]["role"] == "SUPER_ADMIN"

    def test_login_bad_creds(self, s):
        r = s.post(f"{API}/auth/login", json={"email": OWNER_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_authenticated(self, s, owner_token):
        r = s.get(f"{API}/auth/me", headers=hdr(owner_token))
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == OWNER_EMAIL
        assert u["studio"]["slug"] == "lumen-pilates"

    def test_me_no_token(self, s):
        sess = requests.Session()
        r = sess.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_register_creates_studio_and_user(self, s):
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "email": f"test_{suffix}@example.com",
            "password": "Pass@12345",
            "full_name": "Test User",
            "studio_name": f"TEST Studio {suffix}",
        }
        r = s.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert "access" in body and "refresh" in body
        assert body["user"]["email"] == payload["email"]
        assert body["user"]["studio"]["name"] == payload["studio_name"]
        assert body["user"]["role"] == "OWNER"

        # verify /me works with new token
        me = s.get(f"{API}/auth/me", headers=hdr(body["access"]))
        assert me.status_code == 200
        assert me.json()["email"] == payload["email"]


# ---------- studios ----------
class TestStudios:
    def test_get_current_studio(self, s, owner_token):
        r = s.get(f"{API}/studios/current", headers=hdr(owner_token))
        assert r.status_code == 200
        st = r.json()
        assert st["name"] == "Lumen Pilates"
        assert "brand_color" in st

    def test_patch_studio_branding(self, s, owner_token):
        new_color = "#" + uuid.uuid4().hex[:6].upper()
        r = s.patch(
            f"{API}/studios/current",
            headers=hdr(owner_token),
            json={"brand_color": new_color, "tagline": "TEST tagline"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["brand_color"] == new_color
        assert r.json()["tagline"] == "TEST tagline"
        # verify persisted
        r2 = s.get(f"{API}/studios/current", headers=hdr(owner_token))
        assert r2.json()["brand_color"] == new_color


# ---------- exercises ----------
class TestExercises:
    def test_list_system_exercises(self, s, owner_token):
        r = s.get(f"{API}/exercises/", headers=hdr(owner_token))
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 25, f"expected >=25 seeded exercises, got {len(data)}"

    def test_filter_category(self, s, owner_token):
        r = s.get(f"{API}/exercises/?category=CORE", headers=hdr(owner_token))
        assert r.status_code == 200
        for ex in r.json():
            assert ex["category"] == "CORE"

    def test_search_q(self, s, owner_token):
        r = s.get(f"{API}/exercises/?q=plank", headers=hdr(owner_token))
        assert r.status_code == 200
        for ex in r.json():
            assert "plank" in ex["name"].lower()

    def test_owner_create_exercise(self, s, owner_token):
        payload = {
            "name": f"TEST_Custom_{uuid.uuid4().hex[:6]}",
            "category": "CORE",
            "difficulty": "BEGINNER",
            "description": "test only",
            "instructions": "Lie on your back. Engage core. Hold.",
            "primary_muscles": ["abs"],
            "equipment": [],
            "default_duration_seconds": 30,
        }
        r = s.post(f"{API}/exercises/", headers=hdr(owner_token), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == payload["name"]
        # GET to verify persistence
        r2 = s.get(f"{API}/exercises/{body['id']}", headers=hdr(owner_token))
        assert r2.status_code == 200
        assert r2.json()["name"] == payload["name"]


# ---------- classes / pipeline ----------
class TestClasses:
    _created_id = None

    def test_create_class_kicks_off_pipeline(self, s, owner_token):
        payload = {
            "title": f"TEST Morning Flow {uuid.uuid4().hex[:6]}",
            "prompt": "A gentle 20 minute pilates flow focused on core stability and breath.",
            "duration_minutes": 20,
            "focus_area": "CORE",
            "difficulty": "BEGINNER",
            "music_style": "Calm Ambient",
        }
        r = s.post(f"{API}/classes/", headers=hdr(owner_token), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["title"] == payload["title"]
        assert body["status"] in ("DRAFT", "SCRIPTING", "SCRIPT_READY", "VOICING",
                                  "AVATAR_RENDERING", "RENDERING", "RENDERED")
        TestClasses._created_id = body["id"]

    def test_pipeline_eventually_completes(self, s, owner_token):
        cid = TestClasses._created_id
        assert cid, "depends on create test"
        deadline = time.time() + 60
        final = None
        while time.time() < deadline:
            r = s.get(f"{API}/classes/{cid}", headers=hdr(owner_token))
            assert r.status_code == 200
            final = r.json()
            if final["status"] in ("RENDERED", "FAILED"):
                break
            time.sleep(2)
        assert final is not None
        assert final["status"] == "RENDERED", (
            f"pipeline did not complete: status={final['status']}, "
            f"err={final.get('error_message')}"
        )
        # script populated
        script = final.get("script_json") or {}
        assert "intro" in script and "segments" in script and "outro" in script, script
        assert isinstance(script["segments"], list) and len(script["segments"]) > 0
        # mocked URLs
        assert final["voice_url"]
        assert final["avatar_url"]
        assert final["video_url"]

    def test_list_classes(self, s, owner_token):
        r = s.get(f"{API}/classes/", headers=hdr(owner_token))
        assert r.status_code == 200
        data = r.json()
        assert any(c["id"] == TestClasses._created_id for c in data)

    def test_regenerate_segment(self, s, owner_token):
        cid = TestClasses._created_id
        r0 = s.get(f"{API}/classes/{cid}", headers=hdr(owner_token))
        before = r0.json()["script_json"]["segments"][0].get("voice_script", "")
        r = s.post(
            f"{API}/classes/{cid}/regenerate-segment",
            headers=hdr(owner_token),
            json={"segment_index": 0, "instruction": "make it softer"},
        )
        assert r.status_code == 200, r.text
        after = r.json()["script_json"]["segments"][0].get("voice_script", "")
        # either changed OR at least still present (LLM fallback may produce same text)
        assert isinstance(after, str) and len(after) > 0

    def test_approve_class(self, s, owner_token):
        cid = TestClasses._created_id
        r = s.post(f"{API}/classes/{cid}/approve", headers=hdr(owner_token))
        assert r.status_code == 200
        assert r.json()["is_approved"] is True

    def test_regenerate_full(self, s, owner_token):
        cid = TestClasses._created_id
        r = s.post(f"{API}/classes/{cid}/regenerate", headers=hdr(owner_token))
        assert r.status_code == 200
        body = r.json()
        assert body["is_approved"] is False
        assert body["status"] in ("DRAFT", "SCRIPTING")


# ---------- admin ----------
class TestAdmin:
    def test_admin_metrics_super_admin(self, s, admin_token):
        r = s.get(f"{API}/admin/metrics", headers=hdr(admin_token))
        assert r.status_code == 200
        for k in ("total_studios", "total_users", "total_classes"):
            assert k in r.json()

    def test_admin_studios(self, s, admin_token):
        r = s.get(f"{API}/admin/studios", headers=hdr(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_admin_users(self, s, admin_token):
        r = s.get(f"{API}/admin/users", headers=hdr(admin_token))
        assert r.status_code == 200

    def test_admin_forbidden_for_owner(self, s, owner_token):
        for ep in ("metrics", "studios", "users"):
            r = s.get(f"{API}/admin/{ep}", headers=hdr(owner_token))
            assert r.status_code == 403, f"{ep} should 403 for owner, got {r.status_code}"


# ---------- tenant isolation ----------
class TestTenantIsolation:
    def test_other_studio_cannot_read_class(self, s, owner_token):
        # create a fresh studio via register
        suffix = uuid.uuid4().hex[:6]
        r = s.post(f"{API}/auth/register", json={
            "email": f"other_{suffix}@example.com",
            "password": "Pass@12345",
            "full_name": "Other Owner",
            "studio_name": f"TEST Other {suffix}",
        })
        assert r.status_code == 201
        other_token = r.json()["access"]

        # try to read Lumen's class
        cid = TestClasses._created_id
        assert cid
        r2 = s.get(f"{API}/classes/{cid}", headers=hdr(other_token))
        assert r2.status_code in (403, 404), f"tenant leak: {r2.status_code} {r2.text}"

        # list should be empty (or not contain Lumen's class)
        r3 = s.get(f"{API}/classes/", headers=hdr(other_token))
        assert r3.status_code == 200
        assert all(c["id"] != cid for c in r3.json())
