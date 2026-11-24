import re
from pathlib import Path
from typing import Tuple
import httpx

from app.config import get_settings

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
}

EXTENSION_TO_MIME = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


class StorageError(Exception):
    """Domain error for file validation or Supabase Storage failures."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def sanitize_filename(raw_name: str) -> str:
    """Strip directory components and unsafe characters to prevent path traversal."""
    base = Path(raw_name or "certificate").name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", base).strip("._")
    if not cleaned:
        cleaned = "certificate"
    if ".." in cleaned:
        raise StorageError("Invalid filename.", status_code=400)
    return cleaned[:120]


def detect_magic_mime(data: bytes) -> str | None:
    """Verify actual file bytes rather than trusting browser-provided Content-Type alone."""
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    return None


def validate_upload_file(filename: str, content_type: str | None, data: bytes) -> Tuple[str, str]:
    """Validate file size, extension, declared MIME, and binary magic signature."""
    settings = get_settings()

    if not data:
        raise StorageError("Uploaded file is empty.", status_code=400)

    if len(data) > settings.max_upload_size_bytes:
        raise StorageError(
            f"File exceeds the {settings.max_upload_size_mb} MB maximum upload size.",
            status_code=413,
        )

    safe_name = sanitize_filename(filename)
    ext = Path(safe_name).suffix.lower()
    if ext not in EXTENSION_TO_MIME:
        raise StorageError(
            "Unsupported file extension. Only PDF, PNG, and JPG/JPEG files are allowed.",
            status_code=400,
        )

    detected_mime = detect_magic_mime(data)
    if not detected_mime:
        raise StorageError(
            "Invalid or corrupted file signature. File contents must be a valid PDF, PNG, or JPEG.",
            status_code=400,
        )

    expected_mime = EXTENSION_TO_MIME[ext]
    if detected_mime != expected_mime:
        raise StorageError(
            "File extension does not match actual file content.",
            status_code=400,
        )

    if content_type and content_type in ALLOWED_TYPES and content_type != detected_mime:
        raise StorageError(
            "Declared file MIME type does not match actual file content.",
            status_code=400,
        )

    return safe_name, detected_mime


def build_storage_path(owner_id: str, certificate_id: str, safe_filename: str) -> str:
    safe_owner = re.sub(r"[^A-Za-z0-9_-]", "", owner_id)
    safe_cert = re.sub(r"[^A-Za-z0-9_-]", "", certificate_id)
    if not safe_owner or not safe_cert:
        raise StorageError("Invalid owner or certificate identifier.", status_code=400)
    return f"owner/{safe_owner}/{safe_cert}/{safe_filename}"


def _supabase_headers() -> tuple[str, str, dict[str, str]]:
    settings = get_settings()
    missing = settings.missing_storage_fields()
    if missing:
        raise StorageError(
            f"Storage service is not configured (missing: {', '.join(missing)}).",
            status_code=503,
        )
    base_url = settings.supabase_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    return base_url, settings.supabase_bucket, headers


def check_storage_health() -> tuple[bool, str]:
    """Verify Supabase bucket exists and is configured as private."""
    try:
        base_url, bucket, headers = _supabase_headers()
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{base_url}/storage/v1/bucket/{bucket}", headers=headers)
        if resp.status_code != 200:
            return False, f"Bucket check failed (HTTP {resp.status_code})"
        info = resp.json()
        if info.get("public") is True:
            return False, f"Bucket '{bucket}' is public! Set it to private in Supabase Storage."
        return True, "private_bucket_ready"
    except StorageError as exc:
        return False, exc.message
    except httpx.HTTPError as exc:
        return False, f"Network error contacting Supabase Storage: {exc}"


def upload_certificate_file(
    owner_id: str,
    certificate_id: str,
    filename: str,
    content_type: str | None,
    data: bytes,
) -> dict:
    """Validate and upload file bytes to Supabase private Storage."""
    safe_name, verified_mime = validate_upload_file(filename, content_type, data)
    storage_path = build_storage_path(owner_id, certificate_id, safe_name)
    base_url, bucket, headers = _supabase_headers()

    upload_headers = {
        **headers,
        "Content-Type": verified_mime,
        "x-upsert": "true",
        "cache-control": "0",
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{base_url}/storage/v1/object/{bucket}/{storage_path}",
                headers=upload_headers,
                content=data,
            )
    except httpx.HTTPError as exc:
        raise StorageError(f"Failed to upload file to cloud storage: {exc}", status_code=502) from exc

    if resp.status_code not in (200, 201):
        raise StorageError(
            f"Cloud storage rejected upload (HTTP {resp.status_code}).",
            status_code=502,
        )

    return {
        "storage_path": storage_path,
        "original_filename": safe_name,
        "file_type": verified_mime,
        "file_size": len(data),
    }


def download_certificate_file(storage_path: str) -> bytes:
    """Fetch private file bytes from Supabase Storage using service-role auth."""
    if not storage_path or ".." in storage_path:
        raise StorageError("Invalid storage path.", status_code=400)

    base_url, bucket, headers = _supabase_headers()
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(
                f"{base_url}/storage/v1/object/authenticated/{bucket}/{storage_path}",
                headers={**headers, "Cache-Control": "no-cache", "Pragma": "no-cache"},
            )
    except httpx.HTTPError as exc:
        raise StorageError(f"Failed to retrieve file from cloud storage: {exc}", status_code=502) from exc

    if resp.status_code in (400, 404):
        try:
            body = resp.json()
        except ValueError:
            body = {}
        if resp.status_code == 404 or str(body.get("statusCode")) == "404" or body.get("code") == "NoSuchKey":
            raise StorageError("Stored certificate file was not found.", status_code=404)
    if resp.status_code != 200:
        raise StorageError(
            f"Cloud storage retrieval failed (HTTP {resp.status_code}).",
            status_code=502,
        )
    return resp.content


def delete_certificate_file(storage_path: str) -> None:
    """Delete a stored object from Supabase Storage."""
    if not storage_path or ".." in storage_path:
        return

    base_url, bucket, headers = _supabase_headers()
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.delete(
                f"{base_url}/storage/v1/object/{bucket}/{storage_path}",
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise StorageError(f"Failed to delete file from cloud storage: {exc}", status_code=502) from exc

    if resp.status_code in (200, 204, 404):
        return
    if resp.status_code == 400:
        try:
            body = resp.json()
        except ValueError:
            body = {}
        if str(body.get("statusCode")) == "404" or body.get("code") == "NoSuchKey":
            return
    raise StorageError(
        f"Cloud storage deletion failed (HTTP {resp.status_code}).",
        status_code=502,
    )
