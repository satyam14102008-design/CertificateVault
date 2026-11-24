from copy import deepcopy
from typing import Any
from bson import ObjectId
from fastapi.testclient import TestClient
import pytest

from app.config import Settings, get_settings
from app.dependencies import get_db
from app.main import app
from app.security import hash_password


class FakeInsertResult:
    def __init__(self, inserted_id: ObjectId):
        self.inserted_id = inserted_id


class FakeCursor:
    def __init__(self, docs: list[dict[str, Any]]):
        self._docs = list(docs)

    def sort(self, sort_spec: list[tuple[str, int]]):
        for field, direction in reversed(sort_spec):
            self._docs.sort(
                key=lambda d: str(d.get(field) or ""),
                reverse=(direction == -1),
            )
        return self

    def skip(self, n: int):
        self._docs = self._docs[n:]
        return self

    def limit(self, n: int):
        self._docs = self._docs[:n]
        return self

    def __iter__(self):
        return iter(deepcopy(self._docs))


def _matches_query(doc: dict[str, Any], query: dict[str, Any]) -> bool:
    import re

    for key, expected in query.items():
        if key == "$or":
            if not any(_matches_query(doc, sub) for sub in expected):
                return False
            continue
        actual = doc.get(key)
        if isinstance(expected, dict) and "$regex" in expected:
            flags = re.IGNORECASE if "i" in expected.get("$options", "") else 0
            if not re.search(expected["$regex"], str(actual or ""), flags):
                return False
        elif actual != expected:
            return False
    return True


class FakeCollection:
    def __init__(self):
        self.docs: list[dict[str, Any]] = []

    def create_index(self, *_args, **_kwargs):
        return "ok"

    def find_one(self, query: dict[str, Any]):
        for doc in self.docs:
            if _matches_query(doc, query):
                return deepcopy(doc)
        return None

    def find(self, query: dict[str, Any]):
        matched = [d for d in self.docs if _matches_query(d, query)]
        return FakeCursor(matched)

    def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for d in self.docs if _matches_query(d, query))

    def insert_one(self, doc: dict[str, Any]):
        stored = deepcopy(doc)
        if "_id" not in stored:
            stored["_id"] = ObjectId()
        self.docs.append(stored)
        return FakeInsertResult(stored["_id"])

    def update_one(self, query: dict[str, Any], update: dict[str, Any]):
        for doc in self.docs:
            if _matches_query(doc, query):
                if "$set" in update:
                    doc.update(deepcopy(update["$set"]))
                return

    def delete_one(self, query: dict[str, Any]):
        for idx, doc in enumerate(self.docs):
            if _matches_query(doc, query):
                self.docs.pop(idx)
                return


class FakeDatabase:
    def __init__(self):
        self._collections = {
            "users": FakeCollection(),
            "certificates": FakeCollection(),
        }

    def __getitem__(self, name: str) -> FakeCollection:
        if name not in self._collections:
            self._collections[name] = FakeCollection()
        return self._collections[name]


TEST_OWNER_EMAIL = "owner@example.test"
TEST_OWNER_PASSWORD = "TestVault#Password2026"
TEST_OWNER_HASH = hash_password(TEST_OWNER_PASSWORD)
TEST_JWT_SECRET = "unit-test-secret-key-at-least-32-chars-long"


@pytest.fixture()
def test_settings() -> Settings:
    return Settings(
        MONGODB_URI="mongodb://localhost:27017",
        DATABASE_NAME="certificate_vault_test",
        JWT_SECRET_KEY=TEST_JWT_SECRET,
        JWT_EXPIRE_MINUTES=60,
        OWNER_EMAIL=TEST_OWNER_EMAIL,
        OWNER_PASSWORD_HASH=TEST_OWNER_HASH,
        SUPABASE_URL="https://test-project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="test-service-role-key",
        SUPABASE_BUCKET="certificates",
        FRONTEND_URL="http://localhost:5173",
        BACKEND_URL="http://localhost:8000",
        MAX_UPLOAD_SIZE_MB=1,
    )


@pytest.fixture()
def fake_db() -> FakeDatabase:
    return FakeDatabase()


@pytest.fixture()
def client(monkeypatch, test_settings: Settings, fake_db: FakeDatabase):
    # Override settings across modules cleanly without reading local .env secrets
    get_settings.cache_clear()
    monkeypatch.setattr("app.config.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.security.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.dependencies.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.routes.auth.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.routes.files.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.services.storage_service.get_settings", lambda: test_settings)
    monkeypatch.setattr("app.main.get_settings", lambda: test_settings)

    app.dependency_overrides[get_db] = lambda: fake_db
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    resp = client.post(
        "/api/auth/login",
        json={"email": TEST_OWNER_EMAIL, "password": TEST_OWNER_PASSWORD},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
