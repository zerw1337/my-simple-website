from fastapi import Depends, HTTPException
from jose import JWTError, ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .jwt import decode_jwt
from src.models.models import Users
from .schemas import UserOut


def get_token_payload(encoded_jwt: str) -> dict:
    try:
        payload = decode_jwt(encoded_jwt)
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Expired token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(session: AsyncSession, token: str) -> UserOut:
    payload: dict = get_token_payload(encoded_jwt=token)
    user_id = int(payload.get("sub"))
    query = (
        select(Users)
        .where(Users.id == user_id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return UserOut.model_validate(result)
