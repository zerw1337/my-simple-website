from fastapi import APIRouter, Depends, Path, File, UploadFile, Response
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis


from src.minio.config import get_minio
from src.models.database import get_session
from api.profiles.schemas import ProfileOut
from .crud import get_current_profile, upload_avatar_process, get_current_profile_avatar
from .dto import profile_dto
from src.redis.dependencies import get_cache
from src.config import settings
from ..auth.dependencies import get_auth
from ..auth.schemas import UserOut

profiles_router = APIRouter(prefix="/profile", tags=["Profiles"])

@profiles_router.get("/{user_id}", response_model=ProfileOut, summary="GET профиль по user_id")
async def get_profile(user_id: int = Path(..., gt=0, lt=10000), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)) -> ProfileOut:
    cached = await r.get(f"profile/{user_id}")
    if cached:
        return json.loads(cached)
    res = await get_current_profile(user_id=user_id, session=session)
    profile = profile_dto(res)
    await r.set(f"profile/{user_id}", json.dumps(profile.model_dump(mode="json")), ex=settings.CACHE_EXPIRE)
    return profile

@profiles_router.get("/avatar/{user_id}/", response_class=Response)
async def get_users_avatar(user_id: int, session: AsyncSession = Depends(get_session), minio = Depends(get_minio)):
    avatar, content_type = await get_current_profile_avatar(user_id=user_id, session=session, minio=minio)
    return Response(avatar, media_type=f"image/{content_type}")

@profiles_router.post("/upload_avatar/", summary="Загрузить аватар")
async def upload_avatar(avatar: UploadFile | None = File(...),
                        user: UserOut = Depends(get_auth),
                        session: AsyncSession = Depends(get_session),
                        minio = Depends(get_minio)):

    await upload_avatar_process(avatar=avatar, user=user, session=session, minio=minio)
    return