"""
Iteration 2 backend tests — profile/password, super-admin studio detail,
admin_metrics.total_exercises, classes DELETE/PATCH, studios prefs.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
API = f"{BASE_URL}/api"

OWNER_EMAIL = "owner@lumen.studio"
OWNER_PASS = "Owner@12345"
ADMIN_EMAIL = "admin@fitstudio.ai"
ADMIN_PASS = "Admin@12345"


def hdr(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers["Content-Type"] = "application/json"
    return sess


def _login(s, email, password):
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def owner_token(s):
    return _login(s, OWNER_EMAIL, OWNER_PASS)["access"]


@pytest.fixture(scope="session")
def admin_token(s):
    return _login(s, ADMIN_EMAIL, ADMIN_PASS)["access"]


@pytest.fixture(scope="session")
def throwaway_owner(s):
    """A fresh owner so we can mutate profile/password safely without breaking seeded creds."""
    suffix = uuid.uuid4().hex[:8]
    email = f"test_tw_{suffix}@example.com"
    pw = "Pass@12345"
    r = s.post(f"{API}/auth/register", json={
        "email": email,
        "password": pw,
        "full_name": "Throwaway Owner",
        "studio_name": f"TEST TW Studio {suffix}",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    return {"email": email, "password": pw, "access": body["access"], "user": body["user"]}


# ───────── PATCH /api/auth/profile ─────────
class TestProfilePatch:
    def test_owner_patch_profile(self, s, throwaway_owner):
        token = throwaway_owner["access"]
        r = s.patch(f"{API}/auth/profile", headers=hdr(token),
                    json={"first_name": "Patched", "last_name": "Name"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["first_name"] == "Patched"
        assert body["last_name"] == "Name"
        # verify persisted via /me
        me = s.get(f"{API}/auth/me", headers=hdr(token))
        assert me.json()["first_name"] == "Patched"

    def test_email_rejected_on_duplicate(self, s, throwaway_owner):
        token = throwaway_owner["access"]
        # Owner email already exists; collide with seeded owner
        r = s.patch(f"{API}/auth/profile", headers=hdr(token),
                    json={"email": OWNER_EMAIL})
        assert r.status_code == 400, r.text
        assert "email" in r.text.lower()

    def test_email_change_ok_then_revert(self, s, throwaway_owner):
        token = throwaway_owner["access"]
        new_email = f"renamed_{uuid.uuid4().hex[:6]}@example.com"
        old_email = throwaway_owner["email"]
        r = s.patch(f"{API}/auth/profile", headers=hdr(token), json={"email": new_email})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == new_email
        # login with new email
        nl = s.post(f"{API}/auth/login", json={"email": new_email, "password": throwaway_owner["password"]})
        assert nl.status_code == 200
        # revert
        r2 = s.patch(f"{API}/auth/profile", headers=hdr(token), json={"email": old_email})
        assert r2.status_code == 200

    def test_super_admin_patch_profile(self, s, admin_token):
        # Patch first_name only, don't touch email
        r = s.patch(f"{API}/auth/profile", headers=hdr(admin_token),
                    json={"first_name": "SuperAdminTest"})
        assert r.status_code == 200
        assert r.json()["first_name"] == "SuperAdminTest"
        # revert
        s.patch(f"{API}/auth/profile", headers=hdr(admin_token),
                json={"first_name": ""})


# ───────── POST /api/auth/password ─────────
class TestPasswordChange:
    def test_wrong_current_password(self, s, throwaway_owner):
        token = throwaway_owner["access"]
        r = s.post(f"{API}/auth/password", headers=hdr(token),
                   json={"current_password": "WRONG", "new_password": "NewPass@123"})
        assert r.status_code == 400
        assert "current password is incorrect" in r.text.lower()

    def test_correct_current_password_changes_and_login_works(self, s, throwaway_owner):
        token = throwaway_owner["access"]
        old_pw = throwaway_owner["password"]
        new_pw = "Changed@123"
        r = s.post(f"{API}/auth/password", headers=hdr(token),
                   json={"current_password": old_pw, "new_password": new_pw})
        assert r.status_code == 200, r.text
        # old login should fail
        bad = s.post(f"{API}/auth/login", json={"email": throwaway_owner["email"], "password": old_pw})
        assert bad.status_code == 401
        # new login succeeds
        good = s.post(f"{API}/auth/login", json={"email": throwaway_owner["email"], "password": new_pw})
        assert good.status_code == 200
        # revert (use new token because old token still valid but doesn't matter)
        new_token = good.json()["access"]
        r2 = s.post(f"{API}/auth/password", headers=hdr(new_token),
                    json={"current_password": new_pw, "new_password": old_pw})
        assert r2.status_code == 200
        # confirm seeded creds work again for this throwaway user
        confirm = s.post(f"{API}/auth/login", json={"email": throwaway_owner["email"], "password": old_pw})
        assert confirm.status_code == 200


# ───────── GET /api/admin/studios/<uuid> ─────────
class TestAdminStudioDetail:
    def test_super_admin_can_fetch_studio_detail(self, s, admin_token):
        # find Lumen
        lst = s.get(f"{API}/admin/studios", headers=hdr(admin_token))
        assert lst.status_code == 200
        lumen = next((x for x in lst.json() if x["slug"] == "lumen-pilates"), None)
        assert lumen is not None
        r = s.get(f"{API}/admin/studios/{lumen['id']}", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        body = r.json()
        for key in ("studio", "members", "classes", "exercises"):
            assert key in body, f"missing key {key}: {body.keys()}"
        assert body["studio"]["slug"] == "lumen-pilates"
        assert isinstance(body["members"], list) and len(body["members"]) >= 1

    def test_owner_forbidden(self, s, owner_token, admin_token):
        lst = s.get(f"{API}/admin/studios", headers=hdr(admin_token))
        any_id = lst.json()[0]["id"]
        r = s.get(f"{API}/admin/studios/{any_id}", headers=hdr(owner_token))
        assert r.status_code == 403

    def test_bad_uuid_returns_404(self, s, admin_token):
        r = s.get(f"{API}/admin/studios/{uuid.uuid4()}", headers=hdr(admin_token))
        assert r.status_code == 404


# ───────── GET /api/admin/metrics — total_exercises ─────────
class TestAdminMetricsExtras:
    def test_total_exercises_present(self, s, admin_token):
        r = s.get(f"{API}/admin/metrics", headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "total_exercises" in data
        assert isinstance(data["total_exercises"], int)
        assert data["total_exercises"] >= 25  # seeded


# ───────── classes DELETE / PATCH ─────────
class TestClassesDeleteAndPatch:
    def test_patch_title_and_music(self, s, owner_token):
        # create a class first
        r = s.post(f"{API}/classes/", headers=hdr(owner_token), json={
            "title": f"TEST Patch {uuid.uuid4().hex[:6]}",
            "prompt": "A short test class.",
            "duration_minutes": 10,
            "focus_area": "CORE",
            "difficulty": "BEGINNER",
            "music_style": "Calm Ambient",
        })
        assert r.status_code == 201
        cid = r.json()["id"]
        new_title = "TEST Patched Title"
        new_music = "Lo-fi Beats"
        rp = s.patch(f"{API}/classes/{cid}", headers=hdr(owner_token),
                     json={"title": new_title, "music_style": new_music})
        assert rp.status_code == 200, rp.text
        assert rp.json()["title"] == new_title
        assert rp.json()["music_style"] == new_music
        # GET to verify persistence
        rg = s.get(f"{API}/classes/{cid}", headers=hdr(owner_token))
        assert rg.json()["title"] == new_title
        assert rg.json()["music_style"] == new_music

    def test_delete_removes_class(self, s, owner_token):
        r = s.post(f"{API}/classes/", headers=hdr(owner_token), json={
            "title": f"TEST Del {uuid.uuid4().hex[:6]}",
            "prompt": "delete me",
            "duration_minutes": 5,
            "focus_area": "CORE",
            "difficulty": "BEGINNER",
            "music_style": "Calm Ambient",
        })
        assert r.status_code == 201
        cid = r.json()["id"]
        rd = s.delete(f"{API}/classes/{cid}", headers=hdr(owner_token))
        assert rd.status_code == 204, rd.text
        # GET should 404
        rg = s.get(f"{API}/classes/{cid}", headers=hdr(owner_token))
        assert rg.status_code == 404


# ───────── PATCH /api/studios/current — avatar/voice prefs ─────────
class TestStudioPrefsPatch:
    def test_patch_avatar_voice(self, s, owner_token):
        new_avatar = f"instructor_test_{uuid.uuid4().hex[:4]}"
        new_voice = f"voice_test_{uuid.uuid4().hex[:4]}"
        r = s.patch(f"{API}/studios/current", headers=hdr(owner_token),
                    json={"avatar_preference": new_avatar, "voice_preference": new_voice})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["avatar_preference"] == new_avatar
        assert body["voice_preference"] == new_voice
        # verify
        r2 = s.get(f"{API}/studios/current", headers=hdr(owner_token))
        assert r2.json()["avatar_preference"] == new_avatar
        assert r2.json()["voice_preference"] == new_voice
