from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence
from fastapi import HTTPException
from sqlalchemy.orm import selectinload

from api.auth.schemas import UserOut
from api.comments.schemas import CreateComment
from src.models.models import Comments


async def get_all_comments_by_post_id(post_id: int, session: AsyncSession) -> Sequence[Comments]:
    query = (
        select(Comments)
        .where(Comments.post_id == post_id)
        .options(selectinload(Comments.user))
        .order_by(Comments.created_at.desc())
    )
    res = await session.execute(query)
    comments = res.scalars().all()
    return comments

async def get_all_comments_by_user_id(user_id: int, session: AsyncSession) -> Sequence[Comments]:
    query = (
        select(Comments)
        .where(Comments.user_id == user_id)
        .options(selectinload(Comments.user))
        .order_by(Comments.created_at.desc())
    )
    res = await session.execute(query)
    comments = res.scalars().all()
    if not comments:
        raise HTTPException(status_code=404,detail=f"No comments found for this user [id:{user_id}]")
    return comments

async def create_new_comment(comment: CreateComment, post_id: int, user: UserOut, session: AsyncSession):
    new_comment = Comments(
        content=comment.content,
        post_id=post_id,
        user_id=user.id,
    )
    session.add(new_comment)
    try:
        await session.commit()
    except IntegrityError:
        raise HTTPException(status_code=403, detail="Something went wrong")
    return {"success": True}

async def delete_current_comment(comment_id: int, user: UserOut, session: AsyncSession) -> Comments:
    query = (
        select(Comments)
        .where(Comments.id == comment_id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="Comment not found")
    deleted_comment = result
    if user.id == result.user_id or user.is_superuser:
        try:
            await session.delete(result)
            await session.commit()
        except Exception:
            raise HTTPException(status_code=403, detail="Something went wrong")
    return deleted_comment