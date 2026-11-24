from datetime import datetime, timezone
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.config import get_settings
from app.database import ensure_indexes, get_database
from app.security import decode_access_token, emails_match

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Database:
    """Provide a MongoDB database handle, failing gracefully if DB is unavailable."""
    try:
        db = get_database()
        return db
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable.",
        ) from exc


def ensure_owner_user(db: Database, email: str) -> dict:
    """Ensure the single private owner record exists in MongoDB users collection."""
    normalized = email.strip().lower()
    ensure_indexes(db)
    existing = db["users"].find_one({"email": normalized})
    if existing:
        return existing

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "email": normalized,
        "label": "My Vault",
        "created_at": now,
        "updated_at": now,
    }
    result = db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_current_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Database = Depends(get_db),
) -> dict:
    """Authenticate request via JWT Bearer token and verify single-owner identity."""
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    settings = get_settings()
    token_email = payload.get("email", "")
    if not settings.owner_email or not emails_match(token_email, settings.owner_email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_doc = ensure_owner_user(db, settings.owner_email)
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable while verifying owner.",
        ) from exc

    owner_id = str(user_doc["_id"])
    if payload.get("sub") != owner_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "owner_id": owner_id,
        "email": user_doc["email"],
        "label": "My Vault",
    }
