"""Interactive CLI helper to configure the single private owner credentials locally in backend/.env.

Run from project root:
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\setup_owner.py
"""

from getpass import getpass
from pathlib import Path
import secrets
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.security import hash_password  # noqa: E402

ENV_FILE = BACKEND_DIR / ".env"


def update_env_values(updates: dict[str, str]) -> None:
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    seen = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            new_lines.append(line)
            continue
        key = line.split("=", 1)[0].strip()
        if key in updates:
            new_lines.append(f"{key}={updates[key]}")
            seen.add(key)
        else:
            new_lines.append(line)

    for key, val in updates.items():
        if key not in seen:
            new_lines.append(f"{key}={val}")

    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def main() -> int:
    print("CertificateVault — Private Owner Account Setup")
    print("Credentials are hashed locally and written directly to backend/.env.\n")

    email = input("Enter your personal owner email: ").strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        print("Invalid email address.")
        return 1

    password = getpass("Enter your vault password (hidden, min 8 chars): ")
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return 1

    confirm = getpass("Confirm your vault password: ")
    if password != confirm:
        print("Passwords do not match.")
        return 1

    password_hash = hash_password(password)
    jwt_secret = secrets.token_urlsafe(48)

    update_env_values(
        {
            "OWNER_EMAIL": email,
            "OWNER_PASSWORD_HASH": password_hash,
            "JWT_SECRET_KEY": jwt_secret,
        }
    )

    print("\nSuccess! Updated OWNER_EMAIL, OWNER_PASSWORD_HASH (Argon2id), and JWT_SECRET_KEY in backend/.env.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
