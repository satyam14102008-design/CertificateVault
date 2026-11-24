from datetime import datetime, timezone
from typing import Any

ALLOWED_CATEGORIES = (
    "Courses",
    "Internships",
    "Hackathons",
    "Workshops",
    "Academic",
    "Competitions",
    "Other",
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_certificate(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert a MongoDB certificate document into the API JSON shape."""
    return {
        "id": str(doc["_id"]),
        "owner_id": str(doc["owner_id"]),
        "title": doc.get("title", ""),
        "issuer": doc.get("issuer", ""),
        "category": doc.get("category", "Other"),
        "issue_date": doc.get("issue_date") or "",
        "description": doc.get("description", ""),
        "certificate_url": doc.get("certificate_url", ""),
        "storage_path": doc.get("storage_path"),
        "original_filename": doc.get("original_filename"),
        "file_type": doc.get("file_type"),
        "file_size": doc.get("file_size"),
        "is_favorite": bool(doc.get("is_favorite", False)),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }
