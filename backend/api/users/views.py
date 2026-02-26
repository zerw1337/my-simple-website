from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr

from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth
from src.models.database import get_session
from .crud import change_current_user_password, change_current_user_email

users_router = APIRouter(prefix="/user", tags=["Users"])


@users_router.patch("/settings/change_password")
async def change_password(new_password: str, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await change_current_user_password(new_password=new_password, in_user=user, session=session)

@users_router.patch("/settings/change_email")
async def change_email(new_email: EmailStr, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await change_current_user_email(new_email=new_email, in_user=user, session=session)