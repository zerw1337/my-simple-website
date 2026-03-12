from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.comments.crud import get_all_comments_by_post_id, get_all_comments_by_user_id, create_new_comment, \
    delete_current_comment
from api.comments.dto import get_all_comments_dto
from api.comments.schemas import Comment, CreateComment
from api.posts_rating.utils import update_posts_rating_by_post_id
from src.models.database import get_session

comments_router = APIRouter(prefix="/comments", tags=["Comments"])

@comments_router.get("/", response_model=list[Comment])
async def get_comments_by_post_id(post_id: int, session: AsyncSession = Depends(get_session)):
    comments_orm = await get_all_comments_by_post_id(post_id=post_id, session=session)
    return get_all_comments_dto(comments_orm)

@comments_router.get("/{user_id}/", response_model=list[Comment])
async def get_comments_by_user_id(user_id: int, session: AsyncSession = Depends(get_session)):
    comments_orm = await get_all_comments_by_user_id(user_id=user_id, session=session)
    return get_all_comments_dto(comments_orm)

@comments_router.post("/",)
async def create_comment(comment: CreateComment, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await create_new_comment(comment=comment, post_id=comment.post_id, user=user, session=session)
    await update_posts_rating_by_post_id(post_id=comment.post_id, session=session)
    return {"success": True}

@comments_router.delete("/{post_id}/")
async def delete_comment(comment_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await delete_current_comment(comment_id=comment_id, user=user, session=session)