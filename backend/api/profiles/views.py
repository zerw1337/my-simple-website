from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_session
from api.profiles.schemas import ProfileOut
from .crud import get_current_profile
from .dto import profile_dto


profiles_router = APIRouter(prefix="/profile", tags=["Profiles"])

@profiles_router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: int = Path(..., gt=0, lt=10000), session: AsyncSession = Depends(get_session)) -> ProfileOut:
    res = await get_current_profile(user_id=user_id, session=session)
    profile = profile_dto(res)
    return profile

