from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import Sequence

from api.auth.schemas import UserOut
from api.posts.schemas import CreatePost
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