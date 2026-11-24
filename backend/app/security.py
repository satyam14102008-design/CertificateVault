from datetime import datetime, timedelta, timezone
import hmac
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.config import get_settings

_ph = PasswordHasher()


def hash_password(plain_password: str) -> str:
    """Hash a password with Argon2id."""
    return _ph.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plaintext password against an Argon2 hash."""
    if not plain_password or not password_hash:
        return False
    try:
        return _ph.verify(password_hash, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def emails_match(provided_email: str, configured_email: str) -> bool:
    return hmac.compare_digest(
        provided_email.strip().lower(),
        configured_email.strip().lower(),
    )


def create_access_token(owner_id: str, email: str) -> tuple[str, int]:
    """Create a signed JWT access token with expiration."""
    settings = get_settings()
    missing = settings.missing_auth_fields()
    if missing:
        raise RuntimeError(f"Authentication is not configured (missing: {', '.join(missing)}).")

    now = datetime.now(timezone.utc)
    expires_delta = timedelta(minutes=settings.jwt_expire_minutes)
    exp = now + expires_delta

    payload = {
        "sub": owner_id,
        "email": email,
        "iss": "certificatevault",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")
    return token, settings.jwt_expire_minutes * 60


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    settings = get_settings()
    if not settings.jwt_secret_key.strip():
        raise jwt.InvalidTokenError("JWT secret key is not configured.")

    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=["HS256"],
        issuer="certificatevault",
        options={"require": ["sub", "exp", "iat", "iss"]},
    )
