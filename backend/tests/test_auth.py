from datetime import datetime, timedelta, timezone
import jwt
from fastapi.testclient import TestClient

from tests.conftest import TEST_JWT_SECRET, TEST_OWNER_EMAIL, TEST_OWNER_PASSWORD


def test_login_success(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": TEST_OWNER_EMAIL, "password": TEST_OWNER_PASSWORD},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == TEST_OWNER_EMAIL
    assert body["user"]["label"] == "My Vault"


def test_login_invalid_password(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": TEST_OWNER_EMAIL, "password": "wrong-password"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password."


def test_login_invalid_email(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": "intruder@example.test", "password": TEST_OWNER_PASSWORD},
    )
    assert resp.status_code == 401


def test_protected_routes_require_auth(client: TestClient):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/certificates").status_code == 401
    assert client.post("/api/certificates", json={"title": "Test"}).status_code == 401


def test_me_returns_owner_info(client: TestClient, auth_headers: dict[str, str]):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == TEST_OWNER_EMAIL
    assert resp.json()["label"] == "My Vault"


def test_expired_token_rejected(client: TestClient, auth_headers: dict[str, str]):
    me = client.get("/api/auth/me", headers=auth_headers).json()
    now = datetime.now(timezone.utc) - timedelta(hours=2)
    expired_token = jwt.encode(
        {
            "sub": me["id"],
            "email": TEST_OWNER_EMAIL,
            "iss": "certificatevault",
            "iat": int((now - timedelta(minutes=60)).timestamp()),
            "exp": int(now.timestamp()),
        },
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()
