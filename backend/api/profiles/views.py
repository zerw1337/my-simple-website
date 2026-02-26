from fastapi import APIRouter, Depends

from src.models.database import get_session
from api.profiles.schemas import ProfileOut, UserId
from .crud import *
from .dto import *


profiles_router = APIRouter(prefix="/profile", tags=["Profiles"])

@profiles_router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: int, session: AsyncSession = Depends(get_session)) -> ProfileOut:
    res = await get_current_profile(user_id=user_id, session=session)
    profile = profile_dto(res)
    return profile

