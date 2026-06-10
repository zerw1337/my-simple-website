from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from api.auth.schemas import UserOut
from src.models.models import Users, Profiles


async def update_last_seen_user_status(new_value: datetime | None, user: UserOut, session: AsyncSession):
    query = (
        update(Users)
        .where(Users.id == user.id)
        .values(last_seen=new_value)
    )
    await session.execute(query)
    query = (
        update(Profiles)
        .where(Profiles.user_id == user.id)
        .values(last_seen=new_value)
    )
    await session.execute(query)
    await session.commit()