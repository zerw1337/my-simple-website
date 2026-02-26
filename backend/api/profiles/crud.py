from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from src.models.models import Profiles

async def get_current_profile(user_id: int, session: AsyncSession) -> Profiles:
    query = (
        select(Profiles)
        .where(Profiles.user_id == user_id)
    )
    res = await session.execute(query)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile