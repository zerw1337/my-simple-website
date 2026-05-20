from fastapi import HTTPException, UploadFile, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import Sequence
import base64

from api.auth.schemas import UserOut
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from images.utils import validate_image
from src.config import settings
from src.minio.utils import MinioService
from src.models.models import Posts, Categories, Users, PostImages


async def create_new_post(user : UserOut,
                          post: CreatePost,
                          imgs: list[UploadFile],
                          minio,
                          session: AsyncSession) -> Posts:
    new_post = Posts(
        title=post.title,
        content=post.content,
        user_id=user.id,
        category_id=post.category_id,
    )
    session.add(new_post)
    try:
        await session.commit()
        await session.refresh(new_post)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Post with that id already exists")
    except Exception:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create new post")
    await create_post_image_process(imgs=imgs, post=new_post, minio=minio, session=session)
    query = (
        select(Posts)
        .where(Posts.id == new_post.id)
        .options(selectinload(Posts.user))
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.comments))
        .options(selectinload(Posts.reactions))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    return result

async def create_post_image_process(imgs: list[UploadFile], post: Posts, minio, session: AsyncSession) -> None:
    minio_client = MinioService(client=minio, bucket=settings.MINIO_BUCKET_IMAGES)
    for img in imgs:
        if img is None:
            continue
        validate_image(file=img)
        prefix = str(post.id)
        key = await minio_client.upload_file(file=img, prefix=prefix, content_type=img.content_type)
        new_img = PostImages(
            key=key,
            post_id=post.id,
        )
        session.add(new_img)
        await session.flush()
    await session.commit()
    return

async def get_all_posts(session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id.desc())
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results

async def get_five_latest_posts(session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id.desc())
        .limit(5)
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results

async def get_next_post_after_this(current_post_id: int, session: AsyncSession) -> Posts:
    query = (
        select(Posts)
        .where(Posts.id > current_post_id)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id.asc())
    )
    res = await session.execute(query)
    results = res.scalars().first()
    return results

async def get_previous_post_from_this(current_post_id: int, session: AsyncSession) -> Posts:
    query = (
        select(Posts)
        .where(Posts.id < current_post_id)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id.desc())
    )
    res = await session.execute(query)
    results = res.scalars().first()
    return results


async def get_current_post_by_id(post_id: int, session: AsyncSession) -> Posts:
    query = (
        select(Posts)
        .where(Posts.id == post_id)
        .options(selectinload(Posts.user))
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.comments))
        .options(selectinload(Posts.reactions))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="Post not found")
    await update_current_post_views_counter(post=result, session=session)
    return result

async def get_posts_by_user_id(user_id: int, session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .where(Posts.user_id == user_id)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id.desc())
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results

async def get_all_posts_ordered_by_views(session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .where(Posts.views != 0)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.views.desc())
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results

async def get_all_posts_ordered_by_rating(session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .where(Posts.rating != 0)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.rating.desc())
    )
    res = await session.execute(query)
    results = res.scalars().all()
    return results


async def edit_current_post(post_id: int, edited_post: UpdatePost, session: AsyncSession) -> Posts:
    post = await get_current_post_by_id(post_id, session)
    for name, val in edited_post.model_dump(exclude_unset=True).items():
        setattr(post, name, val)
    session.add(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    query = (
        select(Posts)
        .where(Posts.id == post_id)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    return result

async def delete_post_by_id(post_id: int, session: AsyncSession):
    post = await get_current_post_by_id(post_id, session)
    await session.delete(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"status": "Post deleted"}

async def update_current_post_views_counter(post: Posts, session: AsyncSession):
    post.views += 1
    session.add(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        return {"status": "Post views counter is already up to date"}

async def get_post_images_by_post_id(post_id: int, session: AsyncSession, minio):
    query = (
        select(PostImages)
        .where(PostImages.post_id == post_id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if not result:
        return []
    minio_service = MinioService(client=minio, bucket=settings.MINIO_BUCKET_IMAGES)
    images = []
    for r in result:
        img = await minio_service.get_file(key=str(r.key))
        images.append(img)
    result = []
    for img in images:
        content = await img["Body"].read()
        content_type = img["ContentType"]
        result.append({
            "data": base64.b64encode(content).decode("utf-8"),
            "content_type": content_type,
        })
    return result