from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.models import Users
from .jwt_payload_operations import get_token_payload
from .schemas import UserOut


async def get_current_user(token: str, session: AsyncSession) -> UserOut:
    payload: dict = get_token_payload(encoded_jwt=token)
    payload_user_id = int(payload.get("sub"))
    payload_user_version = int(payload.get("user_version"))
    query = (
        select(Users)
        .where(Users.id == payload_user_id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    if result.user_version != payload_user_version:
        raise HTTPException(status_code=403, detail="Token expired [user_version]")
    return UserOut.model_validate(result)
