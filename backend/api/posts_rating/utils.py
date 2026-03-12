import math

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.models.models import Posts


def calculate_rating_for_post(views: int, reactions: int, comments: int) -> int:
    views_score = math.log(views+1) * 10
    reactions_score = reactions * 5
    comments_score = comments * 8
    score = views_score + reactions_score + comments_score
    return max(0, min(100, round(score)))

async def update_posts_rating_by_post_id(post_id: int, session: AsyncSession):
    query = (
        select(Posts)
        .where(Posts.id == post_id)
        .options(selectinload(Posts.reactions))
        .options(selectinload(Posts.comments))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        return {"status": "rating has not been updated, due to post not found"}
    score = calculate_rating_for_post(views=result.views, reactions=len(result.reactions), comments=len(result.comments))
    result.rating = score
    session.add(result)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
    return {"status": "rating updated successfully"}

async def update_posts_rating_by_post_model(post: Posts, session: AsyncSession):
    score = calculate_rating_for_post(views=post.views, reactions=len(post.reactions), comments=len(post.comments))
    post.rating = score
    session.add(post)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
    return {"status": "rating updated successfully"}

