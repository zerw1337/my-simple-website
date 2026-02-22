from jose import jwt
from datetime import datetime, timedelta

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

def create_access_token(id: str, username: str):
    payload = {
        "sub": str(id),
        "username": username,
        token_fields.TOKEN_TYPE_FIELD: token_fields.ACCESS_TOKEN_FIELD,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRES_MINUTES),
    }
    return encode_jwt(payload=payload)

def create_refresh_token(id: str, username: str):
    payload = {
        "sub": str(id),
        "username": username,
        token_fields.TOKEN_TYPE_FIELD: token_fields.REFRESH_TOKEN_FIELD,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRES_DAYS),
    }
    return encode_jwt(payload=payload)