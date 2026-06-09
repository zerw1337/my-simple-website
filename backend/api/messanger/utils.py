import uuid
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, WebSocketException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update, delete
from sqlalchemy.orm import selectinload

from api.auth.schemas import UserOut
from api.messanger.dto import chats_list_dto, get_chat_by_uuid_dto
from src.models.models import Chats, ChatParticipants, Messages, Users


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


    other_user_res = await session.execute(
        select(Users).
        where(Users.id == user_id)
    )
    other_user = other_user_res.scalar_one_or_none()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_chat = Chats(uuid=str(uuid.uuid4()))
    session.add(new_chat)
    await session.flush()
    session.add_all([
        ChatParticipants(chat_id=new_chat.id, user_id=user.id, username=user.username),
        ChatParticipants(chat_id=new_chat.id, user_id=user_id, username=other_user.username),
    ])
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Error creating chat")
    return {"success": True, "chat_id": new_chat.id, "chat_uuid": new_chat.uuid}


async def get_all_my_chats(user: UserOut, session: AsyncSession):
    query = (
        select(Chats)
        .join(Chats.participants)
        .where(ChatParticipants.user_id == user.id)
        .options(
            selectinload(Chats.last_message).selectinload(Messages.user),
            selectinload(Chats.participants),
        )
    )
    res = await session.execute(query)
    chats_list = res.scalars().all()
    query = (
        select(
            ChatParticipants.chat_id,
            func.count(Messages.id).label("unread_count")
        )
        .outerjoin(
            Messages,
            and_(
                Messages.chat_id == ChatParticipants.chat_id,
                Messages.id > func.coalesce(
                    ChatParticipants.last_read_message_id,
                    0
                )
            )
        )
        .where(ChatParticipants.user_id == user.id)
        .group_by(ChatParticipants.chat_id)
    )
    res = await session.execute(query)
    unread_counts = {
        chat_id: unread_count
        for chat_id, unread_count in res.all()
    }

    return chats_list_dto(chats=chats_list, current_user_id=user.id, unread_counts=unread_counts)


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
        .order_by(Messages.created_at.asc())
    )
    res = await session.execute(query)
    chat_orm = res.scalars().all()
    query = (
        update(ChatParticipants)
        .where(and_(ChatParticipants.user_id == user.id, ChatParticipants.chat_id == result.id))
        .values(
            last_read_message_id=chat_orm[-1].id if chat_orm else None
        )
    )
    await session.execute(query)
    await session.commit()
    return get_chat_by_uuid_dto(chat_orm)


async def upload_new_message_to_database(message: str, chat_uuid: str, session: AsyncSession, user: UserOut):
    query = select(Chats).where(Chats.uuid == chat_uuid)
    res = await session.execute(query)
    result = res.scalars().first()
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    new_message = Messages(chat_id=result.id, message=message, user_id=user.id)
    session.add(new_message)
    await session.flush()
    result.last_message_id = new_message.id
    result.last_message_text = new_message.message
    result.last_message_created_at = new_message.created_at
    query = (
        update(ChatParticipants)
        .where(and_(ChatParticipants.chat_id == new_message.chat_id, ChatParticipants.user_id == user.id))
        .values(last_read_message_id=new_message.id)
    )
    await session.execute(query)
    await session.commit()
    return new_message


async def edit_message(message_id: int, message: str, session: AsyncSession, user: UserOut):
    query = (
        select(Messages)
        .where(and_(Messages.id == message_id, Messages.user_id == user.id))
    )
    res = await session.execute(query)
    message_orm = res.scalar_one_or_none()
    if not message_orm:
        raise WebSocketException(code=1008)
    message_orm.message = message
    await session.flush()
    query = (
        select(Messages)
        .where(Messages.chat_id == message_orm.chat_id)
        .order_by(Messages.created_at.desc())
        .limit(1)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result.id == message_orm.id:
        query = (
            update(Chats)
            .where(Chats.id == result.chat_id)
            .values(last_message_id=result.id, last_message_text=result.message, last_message_created_at=result.created_at)
        )
        await session.execute(query)
    await session.flush()
    await session.commit()
    return message_orm


async def delete_message(message_id: int, session: AsyncSession, user: UserOut):
    query = (
        delete(Messages)
        .where(and_(Messages.id == message_id, Messages.user_id == user.id))
        .returning(Messages)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    try:
        await session.flush()
        query = (
            select(Chats).
            where(Chats.id == result.chat_id)
        )
        res = await session.execute(query)
        chat_orm = res.scalar_one_or_none()
        query = (
            select(Messages)
            .where(Messages.chat_id == chat_orm.id)
            .order_by(Messages.created_at.desc())
            .limit(1)
        )
        res = await session.execute(query)
        last_message_orm = res.scalar_one_or_none()
        chat_orm.last_message_id = last_message_orm.id if last_message_orm else None
        chat_orm.last_message_text = last_message_orm.message if last_message_orm else None
        chat_orm.last_message_created_at = last_message_orm.created_at if last_message_orm else None
        await session.commit()
        return message_id
    except IntegrityError:
        await session.rollback()
        raise WebSocketException(code=1008)

async def update_last_read_message_for_participant(message: Messages, session: AsyncSession, user: UserOut):
    query = (
        update(ChatParticipants)
        .where(and_(ChatParticipants.chat_id == message.chat_id, ChatParticipants.user_id != user.id))
        .values(last_read_message_id=message.id)
    )
    await session.execute(query)
    await session.commit()
    return

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