from fastapi import APIRouter , HTTPException
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.comments.crud import get_all_comments_by_post_id, get_all_comments_by_user_id, create_new_comment, \
    delete_current_comment
from api.comments.dto import get_all_comments_dto, get_comment_dto
from api.comments.schemas import Comment, CreateComment
from api.posts_rating.utils import update_posts_rating_by_post_id
from src.models.database import get_session
from src.redis.dependencies import get_cache
from src.config import settings
from api.rate_limiter.limiter import is_limited_comments

comments_router = APIRouter(prefix="/comments", tags=["Comments"])

@comments_router.get("/", response_model=list[Comment])
async def get_comments_by_post_id(post_id: int, session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get(f"comments_by_post/{post_id}")
    if cached:
        return json.loads(cached)
    comments_orm = await get_all_comments_by_post_id(post_id=post_id, session=session)
    comments_dto = get_all_comments_dto(comments_orm)
    await r.set(f"comments_by_post/{post_id}", json.dumps([c.model_dump(mode="json") for c in comments_dto]), ex=settings.CACHE_EXPIRE)
    return comments_dto

@comments_router.get("/by_user/{user_id}/", response_model=list[Comment])
async def get_comments_by_user_id(user_id: int, session: AsyncSession = Depends(get_session), r:Redis = Depends(get_cache)):
    cached = await r.get(f"comments_by_user/{user_id}")
    if cached:
        return json.loads(cached)
    comments_orm = await get_all_comments_by_user_id(user_id=user_id, session=session)
    comments_dto = get_all_comments_dto(comments_orm)
    await r.set(f"comments_by_user/{user_id}", json.dumps([c.model_dump(mode="json") for c in comments_dto]), ex=settings.CACHE_EXPIRE)
    return comments_dto


@comments_router.post("/", response_model=Comment, status_code=201)
async def create_comment(comment: CreateComment, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    if await is_limited_comments(user_id=user.id):
        raise HTTPException(status_code=429, detail="Your comment limit per day has been reached")
    new_orm = await create_new_comment(comment=comment, post_id=comment.post_id, user=user, session=session)
    await update_posts_rating_by_post_id(post_id=comment.post_id, session=session)
    await r.delete(f"comments_by_post/{comment.post_id}")
    await r.delete(f"comments_by_user/{user.id}")
    return get_comment_dto(new_orm)

@comments_router.delete("/{comment_id}/")
async def delete_comment(comment_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
     comment = await delete_current_comment(comment_id=comment_id, user=user, session=session)
     await r.delete(f"comments_by_post/{comment.post_id}")
     await r.delete(f"comments_by_user/{comment.user_id}")
     return {"success": True}