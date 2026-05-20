from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, UploadFile

from images.utils import validate_image
from src.minio.utils import MinioService
from api.auth.schemas import UserOut
from src.config import settings
from src.models.models import Profiles, Avatars


async def get_current_profile(user_id: int, session: AsyncSession) -> Profiles:
    query = (
        select(Profiles)
        .where(Profiles.user_id == user_id)
        .options(selectinload(Profiles.user))
    )
    res = await session.execute(query)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

async def get_current_profile_avatar(user_id: int, session: AsyncSession, minio):
    query = (
        select(Avatars)
        .where(Avatars.profile_id == user_id)
    )
    res = await session.execute(query)
    avatar_orm = res.scalar_one_or_none()
    if not avatar_orm:
        raise HTTPException(status_code=404, detail="Avatar not found")
    minio_service = MinioService(
        client=minio,
        bucket=settings.MINIO_BUCKET_AVATARS,
    )
    avatar = await minio_service.get_file(key=avatar_orm.key)
    content_type = avatar["ContentType"]
    result = await avatar["Body"].read()
    return result, content_type

async def upload_avatar_process(
                        avatar: UploadFile | None,
                        user: UserOut,
                        session: AsyncSession,
                        minio):
    if avatar is None:
        return
    validate_image(file=avatar)
    minio_service = MinioService(client=minio, bucket=settings.MINIO_BUCKET_AVATARS)
    await check_if_current_user_has_avatars_and_delete(session=session, user=user, minio_service=minio_service)
    key = await minio_service.upload_file(file=avatar, content_type=avatar.content_type, prefix=str(user.id))
    avatar_orm = Avatars(
        key=key,
        profile_id=user.id,
    )
    session.add(avatar_orm)
    await session.commit()

    return

async def check_if_current_user_has_avatars_and_delete(session: AsyncSession, user: UserOut, minio_service: MinioService):
    query = (
        select(Avatars)
        .where(Avatars.profile_id == user.id)
    )
    res = await session.execute(query)
    avatar = res.scalar_one_or_none()
    if avatar is None:
        return
    await minio_service.delete_file(key=avatar.key)
    await session.delete(avatar)
    await session.flush()
    return

