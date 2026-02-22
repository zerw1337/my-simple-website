from fastapi import HTTPException
from jose import ExpiredSignatureError, JWTError

from .jwt import decode_jwt
from .schemas import token_fields


def get_token_payload(encoded_jwt: str) -> dict:
    try:
        payload = decode_jwt(encoded_jwt)
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Expired token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def validate_token_type(payload: dict, expected_type: str) -> bool:
    in_type = payload.get(token_fields.TOKEN_TYPE_FIELD)
    if in_type == expected_type:
        return True
    raise HTTPException(status_code=403, detail=f"Got token type: {in_type!r}, expected {expected_type!r}")
