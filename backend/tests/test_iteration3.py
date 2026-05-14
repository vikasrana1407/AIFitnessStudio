"""
Iteration 3 backend tests for FitStudio AI:
- /studios/current returns 200 + null for super admin
- /classes/ returns 200 + [] for super admin
- PATCH /auth/profile accepts profile_picture_url + theme_preference
- POST /api/uploads/profile-picture (validates type/size, updates user)
- POST /api/uploads/studio-logo (role-gated + studio-required)
- Returned upload URL is reachable
- Exercise scope=system create as SUPER_ADMIN
- Owner-created exercises are studio-scoped
- PATCH/DELETE system exercise restricted to SUPER_ADMIN
"""
import io
import os
import uuid
import pytest
import requests
from PIL import Image

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
    return {"Authorization": f"Bearer {t}"}


def jhdr(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
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


def _png_bytes(size=(64, 64), color=(120, 80, 200)):
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------- Endpoints that used to 400 for super admin ----------
class TestSuperAdminGracefulEmpty:
    def test_studios_current_returns_null_for_super_admin(self, s, admin_token):
        r = s.get(f"{API}/studios/current", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        # Empty body or JSON null both acceptable (Django Response(None) yields empty body)
        body_txt = r.text.strip()
        if body_txt:
            assert body_txt in ("null", "None") or r.json() is None

    def test_studios_current_returns_studio_for_owner(self, s, owner_token):
        r = s.get(f"{API}/studios/current", headers=hdr(owner_token))
        assert r.status_code == 200
        body = r.json()
        assert body is not None
        assert body.get("slug") == "lumen-pilates"

    def test_classes_returns_empty_list_for_super_admin(self, s, admin_token):
        r = s.get(f"{API}/classes/", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        assert r.json() == []

    def test_classes_returns_studio_classes_for_owner(self, s, owner_token):
        r = s.get(f"{API}/classes/", headers=hdr(owner_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- PATCH /auth/profile profile_picture_url + theme ----------
class TestProfilePicAndTheme:
    def test_patch_profile_picture_url_and_theme(self, s, owner_token):
        url_val = "https://example.com/pic.png"
        r = s.patch(
            f"{API}/auth/profile",
            headers=jhdr(owner_token),
            json={"profile_picture_url": url_val, "theme_preference": "dark"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("profile_picture_url") == url_val
        assert body.get("theme_preference") == "dark"
        # Persist + /me
        me = s.get(f"{API}/auth/me", headers=hdr(owner_token))
        assert me.json().get("profile_picture_url") == url_val
        assert me.json().get("theme_preference") == "dark"

    @pytest.mark.parametrize("theme", ["light", "dark", "system"])
    def test_theme_values_accepted(self, s, owner_token, theme):
        r = s.patch(
            f"{API}/auth/profile",
            headers=jhdr(owner_token),
            json={"theme_preference": theme},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("theme_preference") == theme


# ---------- Uploads: profile-picture & studio-logo ----------
class TestUploads:
    def test_profile_picture_upload_happy(self, s, owner_token):
        png = _png_bytes()
        files = {"file": ("test.png", png, "image/png")}
        r = s.post(f"{API}/uploads/profile-picture", headers=hdr(owner_token), files=files)
        assert r.status_code == 200, r.text
        url = r.json().get("url")
        assert url, r.json()
        # URL should be absolute https through /api/media/
        assert url.startswith("http"), url
        assert "/api/media/" in url, url
        # user.profile_picture_url updated
        me = s.get(f"{API}/auth/me", headers=hdr(owner_token))
        assert me.json().get("profile_picture_url") == url
        # URL is reachable
        head = requests.get(url, timeout=30)
        assert head.status_code == 200, f"upload URL not reachable: {head.status_code}"
        ctype = head.headers.get("content-type", "")
        assert "image" in ctype, f"unexpected content-type {ctype}"

    def test_profile_picture_rejects_bad_type(self, s, owner_token):
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        r = s.post(f"{API}/uploads/profile-picture", headers=hdr(owner_token), files=files)
        assert r.status_code == 400, r.text

    def test_profile_picture_no_file(self, s, owner_token):
        r = s.post(f"{API}/uploads/profile-picture", headers=hdr(owner_token))
        assert r.status_code == 400

    def test_studio_logo_upload_owner(self, s, owner_token):
        png = _png_bytes(color=(10, 200, 100))
        files = {"file": ("logo.png", png, "image/png")}
        r = s.post(f"{API}/uploads/studio-logo", headers=hdr(owner_token), files=files)
        assert r.status_code == 200, r.text
        url = r.json().get("url")
        assert url and "/api/media/" in url
        # studio.logo_url updated
        st = s.get(f"{API}/studios/current", headers=hdr(owner_token))
        assert st.json().get("logo_url") == url
        # URL reachable
        head = requests.get(url, timeout=30)
        assert head.status_code == 200

    def test_studio_logo_super_admin_without_studio(self, s, admin_token):
        png = _png_bytes()
        files = {"file": ("logo.png", png, "image/png")}
        r = s.post(f"{API}/uploads/studio-logo", headers=hdr(admin_token), files=files)
        # Super admin has no studio → 400 'User has no studio' (per spec)
        assert r.status_code in (400, 403), r.text
        if r.status_code == 400:
            assert "studio" in r.text.lower()


# ---------- Exercises CRUD scope=system & role-gating ----------
class TestExerciseSystemAndStudioScope:
    _system_ex_id = None
    _studio_ex_id = None

    def test_super_admin_creates_system_exercise(self, s, admin_token):
        payload = {
            "name": f"TEST_System_{uuid.uuid4().hex[:6]}",
            "category": "CORE",
            "difficulty": "BEGINNER",
            "description": "system test",
            "instructions": "Lie down. Engage core. Hold.",
            "primary_muscles": ["abs"],
            "equipment": [],
            "default_duration_seconds": 30,
        }
        r = s.post(f"{API}/exercises/?scope=system", headers=jhdr(admin_token), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == payload["name"]
        # studio should be null
        assert body.get("studio") in (None, "", "null")
        TestExerciseSystemAndStudioScope._system_ex_id = body["id"]

    def test_owner_creates_studio_exercise(self, s, owner_token):
        payload = {
            "name": f"TEST_Studio_{uuid.uuid4().hex[:6]}",
            "category": "CORE",
            "difficulty": "BEGINNER",
            "description": "studio test",
            "instructions": "Stretch. Repeat.",
            "primary_muscles": ["abs"],
            "equipment": [],
            "default_duration_seconds": 30,
        }
        r = s.post(f"{API}/exercises/", headers=jhdr(owner_token), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        # studio should NOT be null
        assert body.get("studio") not in (None, "", "null"), body
        TestExerciseSystemAndStudioScope._studio_ex_id = body["id"]

    def test_owner_cannot_patch_system_exercise(self, s, owner_token):
        sid = TestExerciseSystemAndStudioScope._system_ex_id
        assert sid, "depends on prior test"
        r = s.patch(
            f"{API}/exercises/{sid}",
            headers=jhdr(owner_token),
            json={"description": "owner attempt to edit system"},
        )
        assert r.status_code == 403, r.text
        assert "system" in r.text.lower()

    def test_super_admin_can_patch_system_exercise(self, s, admin_token):
        sid = TestExerciseSystemAndStudioScope._system_ex_id
        new_instr = "TEST patched by super admin — new instructions text."
        r = s.patch(
            f"{API}/exercises/{sid}",
            headers=jhdr(admin_token),
            json={"instructions": new_instr},
        )
        assert r.status_code == 200, r.text
        assert r.json()["instructions"] == new_instr

    def test_owner_cannot_delete_system_exercise(self, s, owner_token):
        sid = TestExerciseSystemAndStudioScope._system_ex_id
        r = s.delete(f"{API}/exercises/{sid}", headers=hdr(owner_token))
        assert r.status_code == 403, r.text

    def test_super_admin_can_delete_system_exercise(self, s, admin_token):
        sid = TestExerciseSystemAndStudioScope._system_ex_id
        r = s.delete(f"{API}/exercises/{sid}", headers=hdr(admin_token))
        assert r.status_code == 204, r.text
        # Confirm gone
        r2 = s.get(f"{API}/exercises/{sid}", headers=hdr(admin_token))
        assert r2.status_code == 404

    def test_owner_can_delete_own_studio_exercise(self, s, owner_token):
        sid = TestExerciseSystemAndStudioScope._studio_ex_id
        r = s.delete(f"{API}/exercises/{sid}", headers=hdr(owner_token))
        assert r.status_code == 204, r.text
