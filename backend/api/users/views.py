from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth
from src.models.database import get_session
from .crud import change_current_user_password

profile_router = APIRouter(prefix="/profile", tags=["Users"])

@profile_router.get("/", response_model=UserOut)
async def get_profile():
    pass

@profile_router.patch("/settings/change_password")
async def change_password(new_password: str, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await change_current_user_password(new_password=new_password, in_user=user, session=session)