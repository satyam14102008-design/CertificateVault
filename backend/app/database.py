from typing import Optional
import certifi
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.config import get_settings

_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    missing = settings.missing_db_fields()
    if missing:
        raise RuntimeError(
            f"Missing required database configuration: {', '.join(missing)}"
        )

    _client = MongoClient(
        settings.mongodb_uri,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
    )
    return _client


def get_database() -> Database:
    settings = get_settings()
    client = get_mongo_client()
    return client[settings.database_name]


def ensure_indexes(db: Database) -> None:
    """Create persistent indexes for users and certificates collections."""
    db["users"].create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")

    certs = db["certificates"]
    certs.create_index([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="idx_certs_owner_created")
    certs.create_index([("owner_id", ASCENDING), ("category", ASCENDING)], name="idx_certs_owner_category")
    certs.create_index([("owner_id", ASCENDING), ("is_favorite", ASCENDING)], name="idx_certs_owner_favorite")
    certs.create_index([("owner_id", ASCENDING), ("title", ASCENDING)], name="idx_certs_owner_title")


def check_database_health() -> tuple[bool, str]:
    """Verify live MongoDB Atlas connectivity via ping."""
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        db = get_database()
        ensure_indexes(db)
        return True, "connected"
    except (RuntimeError, PyMongoError) as exc:
        return False, str(exc)


def close_mongo_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
