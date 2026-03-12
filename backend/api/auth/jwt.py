from jose import jwt
from datetime import datetime, timedelta
import uuid

from sqlalchemy.testing.pickleable import User

from src.config import settings
from .schemas import token_fields

def encode_jwt(payload: dict) -> str:
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY.read_text(),
        algorithm=settings.JWT_ALGORITHM,
    )

def decode_jwt(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_PUBLIC_KEY.read_text(),
        algorithms=[settings.JWT_ALGORITHM]
    )

def create_access_token(id: str, username: str, user_version: int, user):
    payload = {
        "sub": str(id),
        "username": username,
        token_fields.TOKEN_TYPE_FIELD: token_fields.ACCESS_TOKEN_FIELD,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRES_MINUTES),
        "user_version": str(user_version),
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
        "is_banned": user.is_banned,
    }
    return encode_jwt(payload=payload)

def create_refresh_token(id: str, username: str, user_version: int, user):
    payload = {
        "sub": str(id),
        "username": username,
        token_fields.TOKEN_TYPE_FIELD: token_fields.REFRESH_TOKEN_FIELD,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRES_DAYS),
        "tid": str(uuid.uuid4().hex),
        "user_version": str(user_version),
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
        "is_banned": user.is_banned,
    }
    return encode_jwt(payload=payload)
