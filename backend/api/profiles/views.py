from fastapi import APIRouter, Depends, Path, File, UploadFile, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis


from src.minio.config import get_minio
from src.models.database import get_session
from api.profiles.schemas import ProfileOut
from .crud import get_current_profile, upload_avatar_process, get_current_profile_avatar
from .dto import profile_dto
from src.redis.dependencies import get_cache, get_limiter
from src.config import settings
from ..auth.dependencies import get_auth
from ..auth.schemas import UserOut
from ..rate_limiter.limiter import is_limited_avatar_upload

profiles_router = APIRouter(prefix="/profile", tags=["Profiles"])

@profiles_router.get("/{user_id}", response_model=ProfileOut, summary="GET профиль по user_id")
async def get_profile(user_id: int = Path(..., gt=0, lt=10000), session: AsyncSession = Depends(get_session)) -> ProfileOut:
    res = await get_current_profile(user_id=user_id, session=session)
    return res

@profiles_router.get("/avatar/{user_id}/", response_class=Response)
async def get_users_avatar(user_id: int, session: AsyncSession = Depends(get_session), minio = Depends(get_minio)):
    avatar, content_type = await get_current_profile_avatar(user_id=user_id, session=session, minio=minio)
    return Response(avatar, media_type=f"{content_type}")

@profiles_router.post("/upload_avatar/", summary="Загрузить аватар")
async def upload_avatar(avatar: UploadFile | None = File(...),
                        user: UserOut = Depends(get_auth),
                        session: AsyncSession = Depends(get_session),
                        minio = Depends(get_minio),):
    if await is_limited_avatar_upload(user_id=user.id):
        raise HTTPException(status_code=429, detail="You have reached your changing avatar limit per day.")
    await upload_avatar_process(avatar=avatar, user=user, session=session, minio=minio)
    return