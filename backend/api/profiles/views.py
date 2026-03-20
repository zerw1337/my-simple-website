from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis

from src.models.database import get_session
from api.profiles.schemas import ProfileOut
from .crud import get_current_profile
from .dto import profile_dto
from src.redis.dependencies import get_cache
from src.config import settings


profiles_router = APIRouter(prefix="/profile", tags=["Profiles"])

@profiles_router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: int = Path(..., gt=0, lt=10000), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)) -> ProfileOut:
    cached = await r.get(f"profile/{user_id}")
    if cached:
        return json.loads(cached)
    res = await get_current_profile(user_id=user_id, session=session)
    profile = profile_dto(res)
    await r.set(f"profile/{user_id}", json.dumps(profile.model_dump(mode="json")), ex=settings.CACHE_EXPIRE)
    return profile

