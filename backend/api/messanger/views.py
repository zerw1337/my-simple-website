from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.messanger.utils import create_new_chat
from src.models.database import get_session

messanger_router = APIRouter(prefix="/chats", tags=["Chats"])

@messanger_router.post("/{user_id}")
async def create_chat(user_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    result = await create_new_chat(user_id=user_id, session=session, user=user)
    return result