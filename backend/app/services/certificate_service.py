import re
from typing import Any
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

from app.models.certificate import ALLOWED_CATEGORIES, serialize_certificate, utc_now_iso
from app.schemas.certificate import CertificateCreate, CertificateUpdate
from app.services.storage_service import StorageError, delete_certificate_file


def _parse_object_id(cert_id: str) -> ObjectId:
    try:
        return ObjectId(cert_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found.",
        ) from exc


def compute_stats(db: Database, owner_id: str) -> dict[str, Any]:
    """Compute vault statistics across all certificates owned by owner_id."""
    docs = list(db["certificates"].find({"owner_id": owner_id}))
    total = len(docs)
    favorites = sum(1 for d in docs if d.get("is_favorite"))
    files_attached = sum(1 for d in docs if d.get("storage_path"))
    storage_used = sum(int(d.get("file_size") or 0) for d in docs)

    by_category = []
    for cat in ALLOWED_CATEGORIES:
        count = sum(1 for d in docs if d.get("category") == cat)
        pct = round((count / total) * 100) if total > 0 else 0
        by_category.append({"category": cat, "count": count, "percentage": pct})

    issuers = sorted({d.get("issuer", "").strip() for d in docs if (d.get("issuer") or "").strip()})

    return {
        "total": total,
        "favorites": favorites,
        "courses": next((c["count"] for c in by_category if c["category"] == "Courses"), 0),
        "internships": next((c["count"] for c in by_category if c["category"] == "Internships"), 0),
        "hackathons": next((c["count"] for c in by_category if c["category"] == "Hackathons"), 0),
        "files_attached_count": files_attached,
        "storage_used_bytes": storage_used,
        "by_category": by_category,
        "issuers": issuers,
    }


def list_certificates(
    db: Database,
    owner_id: str,
    *,
    search: str = "",
    category: str = "",
    issuer: str = "",
    favorites_only: bool = False,
    sort: str = "newest",
    page: int = 1,
    limit: int = 100,
) -> dict[str, Any]:
    """Query persistent certificates for owner_id with search, filters, sorting, and pagination."""
    query: dict[str, Any] = {"owner_id": owner_id}

    if category and category != "All":
        query["category"] = category

    if issuer and issuer != "All":
        query["issuer"] = issuer

    if favorites_only:
        query["is_favorite"] = True

    trimmed = search.strip()
    if trimmed:
        safe_pattern = re.escape(trimmed)
        regex = {"$regex": safe_pattern, "$options": "i"}
        query["$or"] = [
            {"title": regex},
            {"issuer": regex},
            {"category": regex},
            {"description": regex},
        ]

    sort_spec = [("issue_date", DESCENDING), ("created_at", DESCENDING)]
    if sort == "oldest":
        sort_spec = [("issue_date", ASCENDING), ("created_at", ASCENDING)]
    elif sort == "title-asc":
        sort_spec = [("title", ASCENDING)]
    elif sort == "title-desc":
        sort_spec = [("title", DESCENDING)]
    elif sort == "added-desc":
        sort_spec = [("created_at", DESCENDING)]

    total = db["certificates"].count_documents(query)
    skip = max(0, (page - 1) * limit)
    cursor = db["certificates"].find(query).sort(sort_spec).skip(skip).limit(limit)
    items = [serialize_certificate(doc) for doc in cursor]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "stats": compute_stats(db, owner_id),
    }


def get_certificate_doc(db: Database, owner_id: str, cert_id: str) -> dict[str, Any]:
    oid = _parse_object_id(cert_id)
    doc = db["certificates"].find_one({"_id": oid, "owner_id": owner_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found.",
        )
    return doc


def create_certificate(db: Database, owner_id: str, payload: CertificateCreate) -> dict[str, Any]:
    now = utc_now_iso()
    doc = {
        "owner_id": owner_id,
        "title": payload.title,
        "issuer": payload.issuer or "",
        "category": payload.category,
        "issue_date": payload.issue_date or "",
        "description": payload.description or "",
        "certificate_url": payload.certificate_url or "",
        "storage_path": None,
        "original_filename": None,
        "file_type": None,
        "file_size": None,
        "is_favorite": bool(payload.is_favorite),
        "created_at": now,
        "updated_at": now,
    }
    res = db["certificates"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_certificate(doc)


def update_certificate(
    db: Database,
    owner_id: str,
    cert_id: str,
    payload: CertificateUpdate,
) -> dict[str, Any]:
    existing = get_certificate_doc(db, owner_id, cert_id)
    updates: dict[str, Any] = {}
    for field in (
        "title",
        "issuer",
        "category",
        "issue_date",
        "description",
        "certificate_url",
        "is_favorite",
    ):
        value = getattr(payload, field)
        if value is not None:
            updates[field] = value

    if not updates:
        return serialize_certificate(existing)

    updates["updated_at"] = utc_now_iso()
    db["certificates"].update_one(
        {"_id": existing["_id"], "owner_id": owner_id},
        {"$set": updates},
    )
    updated = get_certificate_doc(db, owner_id, cert_id)
    return serialize_certificate(updated)


def delete_certificate(db: Database, owner_id: str, cert_id: str) -> None:
    """Delete stored file first (safe against orphaned storage objects), then delete MongoDB record."""
    existing = get_certificate_doc(db, owner_id, cert_id)
    storage_path = existing.get("storage_path")

    if storage_path:
        try:
            delete_certificate_file(storage_path)
        except StorageError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not delete stored file before removing record: {exc.message}",
            ) from exc

    db["certificates"].delete_one({"_id": existing["_id"], "owner_id": owner_id})


def attach_file_to_certificate(
    db: Database,
    owner_id: str,
    cert_id: str,
    file_meta: dict[str, Any],
) -> dict[str, Any]:
    existing = get_certificate_doc(db, owner_id, cert_id)
    old_path = existing.get("storage_path")

    db["certificates"].update_one(
        {"_id": existing["_id"], "owner_id": owner_id},
        {
            "$set": {
                "storage_path": file_meta["storage_path"],
                "original_filename": file_meta["original_filename"],
                "file_type": file_meta["file_type"],
                "file_size": file_meta["file_size"],
                "updated_at": utc_now_iso(),
            }
        },
    )

    if old_path and old_path != file_meta["storage_path"]:
        try:
            delete_certificate_file(old_path)
        except StorageError:
            # New file and DB pointer are already consistent; old orphan cleanup best-effort
            pass

    updated = get_certificate_doc(db, owner_id, cert_id)
    return serialize_certificate(updated)


def detach_file_from_certificate(db: Database, owner_id: str, cert_id: str) -> dict[str, Any]:
    existing = get_certificate_doc(db, owner_id, cert_id)
    storage_path = existing.get("storage_path")

    if storage_path:
        try:
            delete_certificate_file(storage_path)
        except StorageError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not delete stored file: {exc.message}",
            ) from exc

    db["certificates"].update_one(
        {"_id": existing["_id"], "owner_id": owner_id},
        {
            "$set": {
                "storage_path": None,
                "original_filename": None,
                "file_type": None,
                "file_size": None,
                "updated_at": utc_now_iso(),
            }
        },
    )
    updated = get_certificate_doc(db, owner_id, cert_id)
    return serialize_certificate(updated)
