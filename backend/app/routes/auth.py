from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.config import get_settings
from app.dependencies import ensure_owner_user, get_current_owner, get_db
from app.schemas.auth import LoginRequest, LoginResponse, OwnerInfo
from app.security import create_access_token, emails_match, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Database = Depends(get_db)):
    settings = get_settings()
    missing = settings.missing_auth_fields()
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication is not configured (missing: {', '.join(missing)}).",
        )

    email_ok = emails_match(payload.email, settings.owner_email)
    password_ok = verify_password(payload.password, settings.owner_password_hash)

    if not (email_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    try:
        user_doc = ensure_owner_user(db, settings.owner_email)
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database error while loading owner account.",
        ) from exc

    owner_id = str(user_doc["_id"])
    token, expires_in = create_access_token(owner_id, user_doc["email"])
    return LoginResponse(
        access_token=token,
        expires_in=expires_in,
        user=OwnerInfo(id=owner_id, email=user_doc["email"], label="My Vault"),
    )


@router.get("/me", response_model=OwnerInfo)
def get_me(owner: dict = Depends(get_current_owner)):
    return OwnerInfo(id=owner["owner_id"], email=owner["email"], label=owner["label"])
