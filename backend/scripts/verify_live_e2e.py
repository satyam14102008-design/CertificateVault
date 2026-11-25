"""Live end-to-end integration test against real FastAPI, MongoDB Atlas, and Supabase Storage.

Uses a temporary synthetic test certificate and PDF payload, verifies Workflows A, B, E, F
plus backup export, and cleans up all test artifacts afterwards.
"""

from pathlib import Path
import shutil
import sys
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402
from app.database import close_mongo_client, get_database  # noqa: E402
from app.dependencies import ensure_owner_user  # noqa: E402
from app.main import app  # noqa: E402
from app.security import create_access_token  # noqa: E402
from app.services.storage_service import StorageError, download_certificate_file  # noqa: E402


def main() -> int:
    settings = get_settings()
    db = get_database()
    owner_doc = ensure_owner_user(db, settings.owner_email)
    token, _ = create_access_token(str(owner_doc["_id"]), owner_doc["email"])
    headers = {"Authorization": f"Bearer {token}"}

    sample_pdf = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    created_ids = []
    temp_backup_root = BACKEND_DIR.parent / "backups" / "_live_e2e_probe"

    try:
        with TestClient(app) as client:
            # 1. Health check
            health = client.get("/api/health")
            assert health.status_code == 200, f"Health failed: {health.text}"
            print("LIVE HEALTH:", health.json())

            # 2. Public read works while write endpoints block unauthenticated callers
            assert client.get("/api/certificates").status_code == 200
            assert client.post("/api/certificates", json={"title": "Unauth"}).status_code == 401

            # 3. Workflow A: Create + Upload PDF -> Preview -> Download
            c1 = client.post(
                "/api/certificates",
                headers=headers,
                json={
                    "title": "__E2E_LIVE_PDF_CERT__",
                    "issuer": "Test Org",
                    "category": "Courses",
                    "issue_date": "2026-10-01",
                },
            )
            assert c1.status_code == 201, c1.text
            cert1_id = c1.json()["id"]
            created_ids.append(cert1_id)

            up = client.post(
                "/api/files/upload",
                headers=headers,
                data={"certificate_id": cert1_id},
                files={"file": ("e2e-probe.pdf", sample_pdf, "application/pdf")},
            )
            assert up.status_code == 200, up.text
            storage_path = up.json()["storage_path"]

            prev = client.get(f"/api/files/{cert1_id}/preview", headers=headers)
            assert prev.status_code == 200 and prev.content == sample_pdf

            dl = client.get(f"/api/files/{cert1_id}/download", headers=headers)
            assert dl.status_code == 200 and dl.content == sample_pdf
            print("LIVE WORKFLOW A (Create -> Upload PDF -> Preview -> Download): OK")

            # 4. Workflow B: Link-only certificate
            c2 = client.post(
                "/api/certificates",
                headers=headers,
                json={
                    "title": "__E2E_LIVE_LINK_CERT__",
                    "category": "Workshops",
                    "certificate_url": "https://example.com/verify/e2e-123",
                },
            )
            assert c2.status_code == 201, c2.text
            cert2_id = c2.json()["id"]
            created_ids.append(cert2_id)
            print("LIVE WORKFLOW B (Link-only Save): OK")

            # 5. Workflow E: Edit & Favorite
            upd = client.put(
                f"/api/certificates/{cert2_id}",
                headers=headers,
                json={"title": "__E2E_LIVE_LINK_CERT_EDITED__", "is_favorite": True},
            )
            assert upd.status_code == 200 and upd.json()["is_favorite"] is True
            print("LIVE WORKFLOW E (Edit & Favorite): OK")

            # 6. Export JSON & CSV
            assert client.get("/api/certificates/export?format=json", headers=headers).status_code == 200
            assert client.get("/api/certificates/export?format=csv", headers=headers).status_code == 200
            print("LIVE EXPORT (JSON & CSV): OK")

            # 7. Backup script verification (metadata + Supabase file download)
            from scripts.backup_vault import run_backup

            assert run_backup(temp_backup_root) == 0
            print("LIVE BACKUP (MongoDB + Supabase Files): OK")

            # 8. Workflow F: Delete both test certificates & verify DB + Storage removal
            for cid in list(created_ids):
                d = client.delete(f"/api/certificates/{cid}", headers=headers)
                assert d.status_code == 204, d.text
                assert client.get(f"/api/certificates/{cid}", headers=headers).status_code == 404
                created_ids.remove(cid)

            # Confirm storage object is gone (retry briefly in case edge cache purges in ~1s)
            import time

            deleted_ok = False
            for _ in range(5):
                try:
                    download_certificate_file(storage_path)
                    time.sleep(1)
                except StorageError as exc:
                    if exc.status_code == 404:
                        deleted_ok = True
                        break
                    raise
            assert deleted_ok, "Deleted storage object remained accessible"
            print("LIVE WORKFLOW F (Delete from MongoDB + Supabase Storage): OK")
    finally:
        cleanup_db = get_database()
        for leftover in cleanup_db["certificates"].find({"title": {"$regex": "^__E2E_LIVE_"}}):
            cleanup_db["certificates"].delete_one({"_id": leftover["_id"]})
        if temp_backup_root.exists():
            shutil.rmtree(temp_backup_root, ignore_errors=True)
        close_mongo_client()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
