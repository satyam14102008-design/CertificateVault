from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_database_health, close_mongo_client
from app.routes import auth, certificates, files
from app.services.storage_service import check_storage_health


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    close_mongo_client()


app = FastAPI(
    title="CertificateVault API",
    description="Private personal digital certificate locker API.",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in settings.frontend_url.split(",")
    if origin.strip()
]
if "http://localhost:5173" in allowed_origins and "http://127.0.0.1:5173" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^chrome-extension://[a-z]{32}$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception):
    # Never expose raw stack traces, credentials, or internal paths
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred."},
    )


app.include_router(auth.router)
app.include_router(certificates.router)
app.include_router(files.router)


@app.get("/")
def root():
    return {
        "service": "CertificateVault API",
        "status": "running",
        "health": "/api/health",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    cfg = get_settings()
    missing_auth = cfg.missing_auth_fields()
    db_ok, db_msg = check_database_health()
    storage_ok, storage_msg = check_storage_health()

    overall_ok = db_ok and storage_ok and not missing_auth
    return JSONResponse(
        status_code=status.HTTP_200_OK if overall_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "ok" if overall_ok else "degraded",
            "database": "connected" if db_ok else "error",
            "storage": storage_msg if storage_ok else "error",
            "auth": "configured" if not missing_auth else "missing_configuration",
        },
    )
