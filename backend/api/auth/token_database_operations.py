from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.models import RefreshTokens
from .jwt_payload_operations import decode_jwt

async def submit_refresh_token(token: str, session: AsyncSession):
    payload = decode_jwt(token)
    token = RefreshTokens(refresh_token_id=payload['tid'], user_id=int(payload['sub']))
    await remove_old_token(payload=payload, session=session)
    session.add(token)
    await session.commit()
    return {"success": True}

async def remove_old_token(payload: dict, session: AsyncSession):
    user_id = payload['sub']
    query = (
        select(RefreshTokens)
        .where(RefreshTokens.user_id == int(user_id))
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if result:
        for el in result:
            await session.delete(el)
    return {"success": True}