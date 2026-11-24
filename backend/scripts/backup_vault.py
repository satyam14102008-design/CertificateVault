"""Backup and restore utility for CertificateVault (MongoDB metadata + Supabase original files).

Usage:
    Backup:
        backend\\.venv\\Scripts\\python.exe backend\\scripts\\backup_vault.py backup
    Restore (from a backup folder):
        backend\\.venv\\Scripts\\python.exe backend\\scripts\\backup_vault.py restore --dir backups\\backup-20261125-025000
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402
from app.database import close_mongo_client, get_database  # noqa: E402
from app.dependencies import ensure_owner_user  # noqa: E402
from app.models.certificate import serialize_certificate  # noqa: E402
from app.services.storage_service import (  # noqa: E402
    StorageError,
    download_certificate_file,
    upload_certificate_file,
)


def run_backup(output_root: Path) -> int:
    settings = get_settings()
    if not settings.owner_email:
        print("OWNER_EMAIL is not configured in backend/.env")
        return 1

    db = get_database()
    owner_doc = ensure_owner_user(db, settings.owner_email)
    owner_id = str(owner_doc["_id"])

    docs = list(db["certificates"].find({"owner_id": owner_id}))
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_dir = output_root / f"backup-{stamp}"
    files_dir = backup_dir / "files"
    files_dir.mkdir(parents=True, exist_ok=True)

    exported_records = []
    downloaded_count = 0
    for doc in docs:
        item = serialize_certificate(doc)
        storage_path = item.get("storage_path")
        if storage_path:
            try:
                content = download_certificate_file(storage_path)
                local_rel = Path("files") / item["id"] / (item.get("original_filename") or "certificate")
                target = backup_dir / local_rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(content)
                item["backup_local_file"] = str(local_rel).replace("\\", "/")
                downloaded_count += 1
            except StorageError as exc:
                print(f"Warning: could not download {storage_path}: {exc.message}")
        exported_records.append(item)

    manifest = {
        "backed_up_at": datetime.now(timezone.utc).isoformat(),
        "owner_email": owner_doc["email"],
        "count": len(exported_records),
        "files_downloaded": downloaded_count,
        "certificates": exported_records,
    }
    (backup_dir / "metadata.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Backup complete: {backup_dir}")
    print(f"Records saved: {len(exported_records)}, Files saved: {downloaded_count}")
    close_mongo_client()
    return 0


def run_restore(backup_dir: Path) -> int:
    metadata_file = backup_dir / "metadata.json"
    if not metadata_file.exists():
        print(f"metadata.json not found in {backup_dir}")
        return 1

    settings = get_settings()
    if not settings.owner_email:
        print("OWNER_EMAIL is not configured in backend/.env")
        return 1

    manifest = json.loads(metadata_file.read_text(encoding="utf-8"))
    db = get_database()
    owner_doc = ensure_owner_user(db, settings.owner_email)
    owner_id = str(owner_doc["_id"])

    restored = 0
    for item in manifest.get("certificates", []):
        existing = db["certificates"].find_one(
            {"owner_id": owner_id, "title": item.get("title"), "created_at": item.get("created_at")}
        )
        if existing:
            continue

        doc = {
            "owner_id": owner_id,
            "title": item.get("title", "Restored Certificate"),
            "issuer": item.get("issuer", ""),
            "category": item.get("category", "Other"),
            "issue_date": item.get("issue_date", ""),
            "description": item.get("description", ""),
            "certificate_url": item.get("certificate_url", ""),
            "storage_path": None,
            "original_filename": None,
            "file_type": None,
            "file_size": None,
            "is_favorite": bool(item.get("is_favorite", False)),
            "created_at": item.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        ins = db["certificates"].insert_one(doc)
        new_id = str(ins.inserted_id)

        local_rel = item.get("backup_local_file")
        if local_rel and (backup_dir / local_rel).exists():
            raw = (backup_dir / local_rel).read_bytes()
            meta = upload_certificate_file(
                owner_id=owner_id,
                certificate_id=new_id,
                filename=item.get("original_filename") or Path(local_rel).name,
                content_type=item.get("file_type"),
                data=raw,
            )
            db["certificates"].update_one({"_id": ins.inserted_id}, {"$set": meta})
        restored += 1

    print(f"Restore complete. Imported {restored} certificates.")
    close_mongo_client()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="CertificateVault backup & restore tool")
    sub = parser.add_subparsers(dest="command", required=True)

    b_parser = sub.add_parser("backup", help="Export MongoDB metadata and Supabase files locally")
    b_parser.add_argument("--out", default=str(PROJECT_ROOT / "backups"))

    r_parser = sub.add_parser("restore", help="Restore certificates from a local backup directory")
    r_parser.add_argument("--dir", required=True)

    args = parser.parse_args()
    if args.command == "backup":
        return run_backup(Path(args.out))
    return run_restore(Path(args.dir))


if __name__ == "__main__":
    raise SystemExit(main())
