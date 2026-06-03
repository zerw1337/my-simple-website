import uuid
from sqlite3 import IntegrityError

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from api.auth.schemas import UserOut
from src.models.models import Chats, Users, ChatParticipants


async def create_new_chat(user_id: int, user: UserOut, session: AsyncSession):
    if user_id == user.id:
        raise HTTPException(status_code=500, detail="You cannot create chat with yourself")
    query = (
        select(Chats)
        .join(ChatParticipants, ChatParticipants.chat_id == Chats.id)
        .where(ChatParticipants.user_id.in_([user_id, user.id]))
        .group_by(Chats.id)
        .having(func.count(ChatParticipants.user_id) == 2)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        raise HTTPException(status_code=403, detail="Chat already exists")
    new_chat = Chats(
        uuid=str(uuid.uuid4()),
    )
    session.add(new_chat)
    await session.flush()
    session.add_all(
        [ChatParticipants(chat_id=new_chat.id, user_id=user.id),
        ChatParticipants(chat_id=new_chat.id, user_id=user_id)]
    )
    try:
        await session.commit()
    except IntegrityError:
        raise HTTPException(status_code=500, detail="Error creating chat")
    return {"success": True,
            "chat_id": new_chat.id,
            "chat_uuid": new_chat.uuid,}
