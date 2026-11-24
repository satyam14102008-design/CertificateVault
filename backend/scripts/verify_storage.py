"""Stage 3 verification script: tests Supabase private bucket upload, retrieval, and deletion."""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.storage_service import (  # noqa: E402
    StorageError,
    check_storage_health,
    delete_certificate_file,
    download_certificate_file,
    upload_certificate_file,
)


def main() -> int:
    ok, msg = check_storage_health()
    if not ok:
        print(f"SUPABASE STORAGE CHECK FAILED: {msg}")
        return 1
    print(f"Supabase Storage bucket check: {msg}")

    sample_pdf = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    try:
        uploaded = upload_certificate_file(
            owner_id="stage3_probe",
            certificate_id="probe_cert",
            filename="probe.pdf",
            content_type="application/pdf",
            data=sample_pdf,
        )
        print("Upload OK:", uploaded["storage_path"])

        downloaded = download_certificate_file(uploaded["storage_path"])
        if downloaded != sample_pdf:
            print("DOWNLOAD MISMATCH")
            return 1
        print("Retrieve/Download OK (bytes match)")

        delete_certificate_file(uploaded["storage_path"])
        print("Delete OK")

        try:
            download_certificate_file(uploaded["storage_path"])
            print("ERROR: deleted file still downloadable")
            return 1
        except StorageError as exc:
            if exc.status_code == 404:
                print("Post-delete verification OK (404 confirmed)")
            else:
                print(f"Unexpected post-delete status: {exc.message}")
                return 1

        return 0
    except StorageError as exc:
        print(f"SUPABASE OPERATION FAILED: {exc.message}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
