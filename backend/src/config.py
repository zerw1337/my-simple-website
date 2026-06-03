from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import ClassVar


class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: str
    DB_USER: str
    DB_PASS: str
    DB_NAME: str

    JWT_SECRET_KEY: Path
    JWT_PUBLIC_KEY: Path
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRES_DAYS: int = 7

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str

    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB_CACHE: int
    REDIS_DB_LIMITER: int
    CACHE_EXPIRE: int = 300
    LIMITER_WINDOW : int = 10
    LIMITER_LIMIT : int = 100
    COMMENT_LIMITER_WINDOW: int = 60 * 60 * 24
    COMMENT_LIMITER_LIMIT : int = 15
    REACTIONS_LIMITER_WINDOW: int = 60 * 60 * 24
    REACTIONS_LIMITER_LIMIT : int = 30
    AVATAR_LIMITER_WINDOW: int = 60 * 60 * 24
    AVATAR_LIMITER_LIMIT : int = 5
    CHANGE_PASSWORD_LIMITER_WINDOW: int = 60 * 60 * 24
    CHANGE_PASSWORD_LIMITER_LIMIT : int = 5
    SMTP_SERVICE_LIMITER_WINDOW: int = 60 * 60 * 24
    SMTP_SERVICE_LIMITER_LIMIT : int = 10

    MINIO_URL: str = "http://minio:9000"
    MINIO_REGION: str
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_BUCKET_IMAGES: str = "images"
    MINIO_BUCKET_VIDEOS: str = "video"
    MINIO_BUCKET_AVATARS: str = "avatars"

    NOTIFICATION_NEW_POST: str = "new_post"
    NOTIFICATION_NEW_COMMENT: str = "new_comment"

    ALLOWED_CONTENT_TYPES: ClassVar[set[str]]  = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    }

    ALLOWED_EXTENSIONS: ClassVar[set[str]] = {"jpg", "jpeg", "png", "webp", "gif"}

    MAX_SIZE_MB: int = 5

    naming_conventions: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s"
    }


    @property
    def DATABASE_URL_asyncpg(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

settings = Settings()