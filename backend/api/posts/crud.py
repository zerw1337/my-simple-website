from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import Sequence

from api.auth.schemas import UserOut
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from src.models.models import Posts, Categories, Users


async def create_new_post(user : UserOut, post: CreatePost, session: AsyncSession):
    new_post = Posts(
        title=post.title,
        content=post.content,
        user_id=user.id,
        category_id=post.category_id,
    )
    session.add(new_post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Post with that id already exists")
    except Exception:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create new post")
    return {"status": "Post created"}

async def get_all_posts(session: AsyncSession) -> Sequence[Posts]:
    query = (
        select(Posts)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
        .order_by(Posts.id)
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
        .where(Posts.id == current_post_id+1)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
    )
    res = await session.execute(query)
    results = res.scalar_one_or_none()
    return results

async def get_previous_post_from_this(current_post_id: int, session: AsyncSession) -> Posts:
    query = (
        select(Posts)
        .where(Posts.id == current_post_id-1)
        .options(selectinload(Posts.category))
        .options(selectinload(Posts.user))
    )
    res = await session.execute(query)
    results = res.scalar_one_or_none()
    return results


async def get_current_post_by_id(post_id: int, session: AsyncSession) -> Posts:
    query = (
        select(Posts)
        .where(Posts.id == post_id)
        .options(selectinload(Posts.user))
        .options(selectinload(Posts.category))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="Post not found")
    return result

async def edit_current_post(post_id: int, edited_post: UpdatePost, session: AsyncSession):
    post = await get_current_post_by_id(post_id, session)
    for name, val in edited_post.dict(exclude_unset=True).items():
        setattr(post, name, val)
    session.add(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"status": "Post edited"}

async def delete_post_by_id(post_id: int, session: AsyncSession):
    post = await get_current_post_by_id(post_id, session)
    await session.delete(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"status": "Post deleted"}