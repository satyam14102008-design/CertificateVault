import csv
import io
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response, status
from pymongo.database import Database

from app.dependencies import get_current_owner, get_db
from app.schemas.certificate import (
    CertificateCreate,
    CertificateListResponse,
    CertificateOut,
    CertificateUpdate,
)
from app.services import certificate_service

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


@router.get("", response_model=CertificateListResponse)
def list_certificates(
    search: str = Query(default="", max_length=120),
    category: str = Query(default=""),
    issuer: str = Query(default=""),
    favorites_only: bool = Query(default=False),
    sort: str = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    return certificate_service.list_certificates(
        db,
        owner["owner_id"],
        search=search,
        category=category,
        issuer=issuer,
        favorites_only=favorites_only,
        sort=sort,
        page=page,
        limit=limit,
    )


@router.get("/export")
def export_certificates(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    data = certificate_service.list_certificates(db, owner["owner_id"], limit=1000)
    items = data["items"]
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if format == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "id",
                "title",
                "issuer",
                "category",
                "issue_date",
                "certificate_url",
                "original_filename",
                "file_type",
                "file_size",
                "is_favorite",
                "description",
                "created_at",
                "updated_at",
            ]
        )
        for item in items:
            writer.writerow(
                [
                    item["id"],
                    item["title"],
                    item["issuer"],
                    item["category"],
                    item["issue_date"],
                    item["certificate_url"],
                    item["original_filename"] or "",
                    item["file_type"] or "",
                    item["file_size"] or "",
                    item["is_favorite"],
                    item["description"],
                    item["created_at"],
                    item["updated_at"],
                ]
            )
        return Response(
            content=buf.getvalue(),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="certificatevault-backup-{stamp}.csv"'
            },
        )

    payload = json.dumps(
        {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "count": len(items),
            "certificates": items,
        },
        indent=2,
    )
    return Response(
        content=payload,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="certificatevault-backup-{stamp}.json"'
        },
    )


@router.post("", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def create_certificate(
    payload: CertificateCreate,
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    return certificate_service.create_certificate(db, owner["owner_id"], payload)


@router.get("/{certificate_id}", response_model=CertificateOut)
def get_certificate(
    certificate_id: str,
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    doc = certificate_service.get_certificate_doc(db, owner["owner_id"], certificate_id)
    from app.models.certificate import serialize_certificate

    return serialize_certificate(doc)


@router.put("/{certificate_id}", response_model=CertificateOut)
def update_certificate(
    certificate_id: str,
    payload: CertificateUpdate,
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    return certificate_service.update_certificate(db, owner["owner_id"], certificate_id, payload)


@router.delete("/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    certificate_id: str,
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    certificate_service.delete_certificate(db, owner["owner_id"], certificate_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
