"""Stage 2 verification script: tests live MongoDB Atlas connection, indexes, and persistent roundtrip."""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import check_database_health, close_mongo_client, get_database  # noqa: E402


def main() -> int:
    ok, msg = check_database_health()
    if not ok:
        print(f"MONGODB CONNECTION FAILED: {msg}")
        return 1

    db = get_database()
    print(f"Connected to MongoDB Atlas database: {db.name}")
    print("Users indexes:", list(db["users"].index_information().keys()))
    print("Certificates indexes:", list(db["certificates"].index_information().keys()))

    # Verify persistent write -> read -> cleanup using an isolated probe record
    probe_coll = db["_connection_probes"]
    insert_res = probe_coll.insert_one({"probe": "stage2_persistence_check"})
    fetched = probe_coll.find_one({"_id": insert_res.inserted_id})
    if not fetched or fetched.get("probe") != "stage2_persistence_check":
        print("PERSISTENCE ROUNDTRIP FAILED")
        close_mongo_client()
        return 1
    probe_coll.delete_one({"_id": insert_res.inserted_id})
    print("Persistent write/read/delete roundtrip: OK")

    close_mongo_client()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
