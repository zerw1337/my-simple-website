from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.posts.crud import create_new_post, get_all_posts, get_current_post_by_id, edit_current_post, delete_post_by_id
from api.posts.dto import get_all_posts_dto, get_post_by_id_dto
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from src.models.database import get_session

posts_router = APIRouter(prefix="/posts", tags=["Posts"])

@posts_router.post("/create/")
async def create_post(new_post : CreatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await create_new_post(user=user, post=new_post, session=session)

@posts_router.get("/")
async def get_posts(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_all_posts(session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.get("/{id}/")
async def get_post_by_id(post_id: int, session: AsyncSession = Depends(get_session)) -> PostOut:
    post_orm = await get_current_post_by_id(post_id=post_id, session=session)
    return get_post_by_id_dto(post=post_orm)

@posts_router.patch("/update/")
async def edit_post(post_id: int, edited_post: UpdatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await edit_current_post(post_id=post_id, edited_post=edited_post, session=session)

@posts_router.delete("/delete/")
async def delete_post(post_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await delete_post_by_id(post_id=post_id, session=session)