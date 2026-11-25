from fastapi.testclient import TestClient

from app.services.storage_service import StorageError


VALID_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
VALID_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"


def test_file_upload_preview_download_and_delete(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
):
    memory_bucket: dict[str, bytes] = {}

    def fake_upload(owner_id, certificate_id, filename, content_type, data):
        from app.services.storage_service import build_storage_path, validate_upload_file

        safe_name, mime = validate_upload_file(filename, content_type, data)
        path = build_storage_path(owner_id, certificate_id, safe_name)
        memory_bucket[path] = data
        return {
            "storage_path": path,
            "original_filename": safe_name,
            "file_type": mime,
            "file_size": len(data),
        }

    def fake_download(storage_path):
        if storage_path not in memory_bucket:
            raise StorageError("Stored certificate file was not found.", status_code=404)
        return memory_bucket[storage_path]

    def fake_delete(storage_path):
        memory_bucket.pop(storage_path, None)

    monkeypatch.setattr("app.routes.files.upload_certificate_file", fake_upload)
    monkeypatch.setattr("app.routes.files.download_certificate_file", fake_download)
    monkeypatch.setattr("app.routes.files.delete_certificate_file", fake_delete)
    monkeypatch.setattr("app.services.certificate_service.delete_certificate_file", fake_delete)

    # Create certificate
    cert = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "AWS Certificate", "category": "Courses"},
    ).json()
    cert_id = cert["id"]

    # Upload PDF
    upload_resp = client.post(
        "/api/files/upload",
        headers=auth_headers,
        data={"certificate_id": cert_id},
        files={"file": ("../../evil/aws-cert.pdf", VALID_PDF, "application/pdf")},
    )
    assert upload_resp.status_code == 200
    updated = upload_resp.json()
    assert updated["original_filename"] == "aws-cert.pdf"
    assert ".." not in updated["storage_path"]
    assert updated["file_type"] == "application/pdf"
    assert updated["file_size"] == len(VALID_PDF)

    # Preview
    preview_resp = client.get(f"/api/files/{cert_id}/preview", headers=auth_headers)
    assert preview_resp.status_code == 200
    assert preview_resp.content == VALID_PDF
    assert "inline;" in preview_resp.headers["content-disposition"]

    # Download
    dl_resp = client.get(f"/api/files/{cert_id}/download", headers=auth_headers)
    assert dl_resp.status_code == 200
    assert dl_resp.content == VALID_PDF
    assert "attachment;" in dl_resp.headers["content-disposition"]

    # Public visitor can preview & download certificate file, but cannot upload or delete
    pub_preview = client.get(f"/api/files/{cert_id}/preview")
    assert pub_preview.status_code == 200
    assert pub_preview.content == VALID_PDF

    pub_dl = client.get(f"/api/files/{cert_id}/download")
    assert pub_dl.status_code == 200
    assert pub_dl.content == VALID_PDF

    assert (
        client.post(
            "/api/files/upload",
            data={"certificate_id": cert_id},
            files={"file": ("hack.pdf", VALID_PDF, "application/pdf")},
        ).status_code
        == 401
    )
    assert client.delete(f"/api/files/{cert_id}").status_code == 401

    # Delete certificate cleans up storage
    del_resp = client.delete(f"/api/certificates/{cert_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    assert memory_bucket == {}


def test_file_validation_rejects_spoofed_and_oversized_files(
    client: TestClient,
    auth_headers: dict[str, str],
):
    cert = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "Security Validation Test"},
    ).json()
    cert_id = cert["id"]

    # Spoofed PDF (plain text claiming to be .pdf)
    spoof_resp = client.post(
        "/api/files/upload",
        headers=auth_headers,
        data={"certificate_id": cert_id},
        files={"file": ("fake.pdf", b"not really a pdf", "application/pdf")},
    )
    assert spoof_resp.status_code == 400
    assert "signature" in spoof_resp.json()["detail"].lower()

    # Unsupported extension
    ext_resp = client.post(
        "/api/files/upload",
        headers=auth_headers,
        data={"certificate_id": cert_id},
        files={"file": ("script.exe", b"MZ...", "application/octet-stream")},
    )
    assert ext_resp.status_code == 400

    # Oversized (> 1 MB configured in test_settings)
    huge_payload = VALID_PNG + (b"\x00" * (1024 * 1024 + 64))
    size_resp = client.post(
        "/api/files/upload",
        headers=auth_headers,
        data={"certificate_id": cert_id},
        files={"file": ("huge.png", huge_payload, "image/png")},
    )
    assert size_resp.status_code == 413


def test_storage_failure_prevents_silent_db_orphan_on_delete(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
):
    def fake_upload(owner_id, certificate_id, filename, content_type, data):
        return {
            "storage_path": f"owner/{owner_id}/{certificate_id}/doc.pdf",
            "original_filename": "doc.pdf",
            "file_type": "application/pdf",
            "file_size": len(data),
        }

    def failing_delete(_storage_path):
        raise StorageError("Supabase outage", status_code=502)

    monkeypatch.setattr("app.routes.files.upload_certificate_file", fake_upload)
    monkeypatch.setattr("app.services.certificate_service.delete_certificate_file", failing_delete)

    cert = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "Partial Failure Test"},
    ).json()
    cert_id = cert["id"]

    assert (
        client.post(
            "/api/files/upload",
            headers=auth_headers,
            data={"certificate_id": cert_id},
            files={"file": ("doc.pdf", VALID_PDF, "application/pdf")},
        ).status_code
        == 200
    )

    del_resp = client.delete(f"/api/certificates/{cert_id}", headers=auth_headers)
    assert del_resp.status_code == 502
    # Record remains intact so user can safely retry
    assert client.get(f"/api/certificates/{cert_id}", headers=auth_headers).status_code == 200
