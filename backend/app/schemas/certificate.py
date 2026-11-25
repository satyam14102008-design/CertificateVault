from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

from app.models.certificate import ALLOWED_CATEGORIES

CategoryLiteral = Literal[
    "Courses",
    "Internships",
    "Hackathons",
    "Workshops",
    "Academic",
    "Competitions",
    "Other",
]


def _validate_optional_url(val: Optional[str]) -> str:
    if val is None:
        return ""
    cleaned = val.strip()
    if not cleaned:
        return ""
    if not (cleaned.startswith("https://") or cleaned.startswith("http://")):
        raise ValueError("Certificate URL must start with https:// or http://.")
    if len(cleaned) > 2048:
        raise ValueError("Certificate URL is too long.")
    return cleaned


def _validate_optional_date(val: Optional[str]) -> str:
    if val is None:
        return ""
    cleaned = val.strip()
    if not cleaned:
        return ""
    try:
        parsed = date.fromisoformat(cleaned)
    except ValueError as exc:
        raise ValueError("Issue date must be in YYYY-MM-DD format.") from exc
    if parsed > date.today():
        raise ValueError("Issue date cannot be in the future.")
    return cleaned


class CertificateCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    issuer: Optional[str] = Field(default="", max_length=120)
    category: CategoryLiteral = "Other"
    issue_date: Optional[str] = ""
    description: Optional[str] = Field(default="", max_length=1000)
    certificate_url: Optional[str] = ""
    is_favorite: bool = False

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Certificate title is required.")
        return cleaned

    @field_validator("issuer", "description")
    @classmethod
    def clean_optional_text(cls, v: Optional[str]) -> str:
        return (v or "").strip()

    @field_validator("certificate_url")
    @classmethod
    def check_url(cls, v: Optional[str]) -> str:
        return _validate_optional_url(v)

    @field_validator("issue_date")
    @classmethod
    def check_date(cls, v: Optional[str]) -> str:
        return _validate_optional_date(v)


class CertificateUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    issuer: Optional[str] = Field(default=None, max_length=120)
    category: Optional[CategoryLiteral] = None
    issue_date: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=1000)
    certificate_url: Optional[str] = None
    is_favorite: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Certificate title cannot be empty.")
        return cleaned

    @field_validator("issuer", "description")
    @classmethod
    def clean_optional_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip()

    @field_validator("certificate_url")
    @classmethod
    def check_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _validate_optional_url(v)

    @field_validator("issue_date")
    @classmethod
    def check_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _validate_optional_date(v)


class CertificateOut(BaseModel):
    id: str
    owner_id: str
    title: str
    issuer: str
    category: str
    issue_date: str
    description: str
    certificate_url: str
    has_file: bool = False
    storage_path: Optional[str] = None
    original_filename: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_favorite: bool
    created_at: str
    updated_at: str


class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: int


class VaultStats(BaseModel):
    total: int
    favorites: int
    courses: int
    internships: int
    hackathons: int
    files_attached_count: int
    storage_used_bytes: int
    by_category: list[CategoryStat]
    issuers: list[str]


class CertificateListResponse(BaseModel):
    items: list[CertificateOut]
    total: int
    page: int
    limit: int
    stats: VaultStats
