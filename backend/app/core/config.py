from functools import lru_cache
from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    # App
    APP_NAME: str = "MikroWize"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://mikrowize:secret@localhost:5432/mikrowize")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-to-a-random-secret-at-least-32-chars")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # MikroTik
    DEFAULT_API_PORT: int = int(os.getenv("DEFAULT_API_PORT", "8728"))
    DEFAULT_SSH_PORT: int = int(os.getenv("DEFAULT_SSH_PORT", "22"))

    # Encryption
    CREDENTIAL_ENCRYPTION_KEY: str = os.getenv("CREDENTIAL_ENCRYPTION_KEY", "change-me-generate-with-fernet-key")


@lru_cache
def get_settings() -> Settings:
    return Settings()
