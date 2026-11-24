from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # MongoDB Atlas
    mongodb_uri: str = Field(default="", alias="MONGODB_URI")
    database_name: str = Field(default="certificate_vault", alias="DATABASE_NAME")

    # Authentication
    jwt_secret_key: str = Field(default="", alias="JWT_SECRET_KEY")
    jwt_expire_minutes: int = Field(default=60, ge=5, le=43200, alias="JWT_EXPIRE_MINUTES")
    owner_email: str = Field(default="", alias="OWNER_EMAIL")
    owner_password_hash: str = Field(default="", alias="OWNER_PASSWORD_HASH")

    # Supabase Storage
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_bucket: str = Field(default="certificates", alias="SUPABASE_BUCKET")

    # URLs & Upload Limits
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")
    max_upload_size_mb: int = Field(default=10, ge=1, le=50, alias="MAX_UPLOAD_SIZE_MB")

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    def missing_db_fields(self) -> list[str]:
        missing = []
        if not self.mongodb_uri.strip():
            missing.append("MONGODB_URI")
        if not self.database_name.strip():
            missing.append("DATABASE_NAME")
        return missing

    def missing_auth_fields(self) -> list[str]:
        missing = []
        if not self.jwt_secret_key.strip():
            missing.append("JWT_SECRET_KEY")
        if not self.owner_email.strip():
            missing.append("OWNER_EMAIL")
        if not self.owner_password_hash.strip():
            missing.append("OWNER_PASSWORD_HASH")
        return missing

    def missing_storage_fields(self) -> list[str]:
        missing = []
        if not self.supabase_url.strip():
            missing.append("SUPABASE_URL")
        if not self.supabase_service_role_key.strip():
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not self.supabase_bucket.strip():
            missing.append("SUPABASE_BUCKET")
        return missing


@lru_cache
def get_settings() -> Settings:
    return Settings()
