from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.models import Users
from .jwt_payload_operations import get_token_payload
from .schemas import UserOut


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
