from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.auth.schemas import UserOut
from src.models.models import Chats, Messages, ChatParticipants


async def get_current_users_chat_uuids(session: AsyncSession, user: UserOut):
    query = (
        select(Chats.uuid)
        .join(Chats.participants)
        .where(ChatParticipants.user_id == user.id)
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results
