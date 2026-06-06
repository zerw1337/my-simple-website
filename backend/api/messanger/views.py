from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.messanger.utils import create_new_chat, get_all_my_chats, get_chat_by_uuid
from src.models.database import get_session

messanger_router = APIRouter(prefix="/chats", tags=["Chats"])

@messanger_router.post("/{user_id}")
async def create_chat(user_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    result = await create_new_chat(user_id=user_id, session=session, user=user)
    return result

@messanger_router.get("/my/")
async def get_my_chats(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await get_all_my_chats(user=user, session=session)

@messanger_router.get("/{chat_uuid}")
async def get_chat(chat_uuid: str, session: AsyncSession = Depends(get_session), user: UserOut = Depends(get_auth)):
    return await get_chat_by_uuid(chat_uuid=chat_uuid, session=session, user=user)