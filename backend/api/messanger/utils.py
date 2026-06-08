import uuid
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, WebSocketException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update, delete
from sqlalchemy.orm import selectinload

from api.auth.schemas import UserOut
from api.messanger.dto import chats_list_dto, get_chat_by_uuid_dto
from src.models.models import Chats, ChatParticipants, Messages


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
        await session.rollback()
        raise HTTPException(status_code=500, detail="Error creating chat")
    return {"success": True,
            "chat_id": new_chat.id,
            "chat_uuid": new_chat.uuid,}

async def get_all_my_chats(user: UserOut, session: AsyncSession):
    query = (
        select(Chats)
        .join(Chats.participants)
        .where(ChatParticipants.user_id == user.id)
        .options(
            selectinload(Chats.last_message)
            .selectinload(Messages.user)
        )
    )
    res = await session.execute(query)
    result = res.scalars().all()
    chats_dto = chats_list_dto(result)
    return chats_dto

async def get_chat_by_uuid(chat_uuid: str, session: AsyncSession, user: UserOut):
    query = (
        select(Chats)
        .join(Chats.participants)
        .where(and_(ChatParticipants.user_id == user.id, Chats.uuid == chat_uuid))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    query = (
        select(Messages)
        .where(Messages.chat_id == result.id)
        .options(selectinload(Messages.user))
        .order_by(Messages.created_at.desc())
    )
    res = await session.execute(query)
    result = res.scalars().all()
    chat_dto = get_chat_by_uuid_dto(result)
    return chat_dto

async def upload_new_message_to_database(message: str, chat_uuid: str,  session: AsyncSession, user: UserOut):
    query = (
        select(Chats)
        .where(Chats.uuid == chat_uuid)
    )
    res = await session.execute(query)
    result = res.scalars().first()
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    new_message = Messages(
        chat_id=result.id,
        message=message,
        user_id=user.id,
    )
    session.add(new_message)
    await session.flush()
    await session.commit()
    return new_message

async def edit_message(message_id: int, message: str, session: AsyncSession, user: UserOut):
    query = (
        select(Messages)
        .where(and_(Messages.id == message_id, Messages.user_id == user.id))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise WebSocketException(code=1008)
    result.message = message
    await session.flush()
    await session.commit()
    return result

async def delete_message(message_id: int, session: AsyncSession, user: UserOut):
    query = (
        delete(Messages)
        .where(and_(Messages.id == message_id, Messages.user_id == user.id))
    )
    await session.execute(query)
    try:
        await session.flush()
        await session.commit()
        return message_id
    except IntegrityError:
        await session.rollback()
        raise WebSocketException(code=1008)

async def check_if_current_user_belongs_to_this_chat(chat_uuid: str, user: UserOut, session: AsyncSession):
    query = (
        select(Chats)
        .join(Chats.participants)
        .where(and_(ChatParticipants.user_id == user.id, Chats.uuid == chat_uuid))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise WebSocketException(code=1008)
