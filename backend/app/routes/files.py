from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from pymongo.database import Database

from app.config import get_settings
from app.dependencies import get_current_owner, get_db, get_vault_owner_context
from app.schemas.certificate import CertificateOut
from app.services import certificate_service
from app.services.storage_service import (
    StorageError,
    delete_certificate_file,
    download_certificate_file,
    upload_certificate_file,
)

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload", response_model=CertificateOut)
async def upload_file(
    certificate_id: str = Form(...),
    file: UploadFile = File(...),
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    # Ensure the target certificate exists and belongs to the authenticated owner
    certificate_service.get_certificate_doc(db, owner["owner_id"], certificate_id)

    settings = get_settings()
    # Read up to limit + 1 byte so oversized uploads are caught cleanly
    raw = await file.read(settings.max_upload_size_bytes + 1)
    if len(raw) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb} MB maximum upload size.",
        )

    try:
        file_meta = upload_certificate_file(
            owner_id=owner["owner_id"],
            certificate_id=certificate_id,
            filename=file.filename or "certificate",
            content_type=file.content_type,
            data=raw,
        )
    except StorageError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    try:
        return certificate_service.attach_file_to_certificate(
            db, owner["owner_id"], certificate_id, file_meta
        )
    except Exception as exc:
        # Roll back uploaded storage object if MongoDB update fails
        try:
            delete_certificate_file(file_meta["storage_path"])
        except StorageError:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file metadata after upload.",
        ) from exc


@router.get("/{certificate_id}/preview")
def preview_file(
    certificate_id: str,
    vault_ctx: dict = Depends(get_vault_owner_context),
    db: Database = Depends(get_db),
):
    doc = certificate_service.get_certificate_doc(db, vault_ctx["owner_id"], certificate_id)
    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file is attached to this certificate.",
        )

    try:
        data = download_certificate_file(storage_path)
    except StorageError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    filename = doc.get("original_filename") or "certificate"
    media_type = doc.get("file_type") or "application/octet-stream"
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


@router.get("/{certificate_id}/download")
def download_file(
    certificate_id: str,
    vault_ctx: dict = Depends(get_vault_owner_context),
    db: Database = Depends(get_db),
):
    doc = certificate_service.get_certificate_doc(db, vault_ctx["owner_id"], certificate_id)
    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file is attached to this certificate.",
        )

    try:
        data = download_certificate_file(storage_path)
    except StorageError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    filename = doc.get("original_filename") or "certificate"
    media_type = doc.get("file_type") or "application/octet-stream"
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


@router.delete("/{certificate_id}", response_model=CertificateOut)
def delete_file(
    certificate_id: str,
    owner: dict = Depends(get_current_owner),
    db: Database = Depends(get_db),
):
    return certificate_service.detach_file_from_certificate(db, owner["owner_id"], certificate_id)
