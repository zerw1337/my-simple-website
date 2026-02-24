from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from src.models.models import RefreshTokens
from .jwt_payload_operations import decode_jwt

async def submit_refresh_token(token: str, session: AsyncSession):
    payload = decode_jwt(token)
    token = RefreshTokens(refresh_token_id=payload['tid'], user_id=int(payload['sub']))
    session.add(token)
    await session.commit()
    return {"success": True}

async def validate_refresh_token_by_db(token: dict, session: AsyncSession):
    query = (
        select(RefreshTokens)
        .where(RefreshTokens.refresh_token_id == token['tid'])
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=401, detail="Invalid token")


async def remove_old_token(user_id: int, session: AsyncSession):
    query = (
        select(RefreshTokens)
        .where(RefreshTokens.user_id == user_id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if result:
        for el in result:
            await session.delete(el)
    return {"success": True}
