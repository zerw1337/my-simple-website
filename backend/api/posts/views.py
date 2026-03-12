from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.posts.crud import create_new_post, get_all_posts, get_current_post_by_id, edit_current_post, delete_post_by_id, \
    get_five_latest_posts, get_next_post_after_this, get_previous_post_from_this, get_posts_by_user_id, \
    get_all_posts_ordered_by_views, get_all_posts_ordered_by_rating
from api.posts.dto import get_all_posts_dto, get_post_by_id_dto
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from api.posts_rating.utils import update_posts_rating_by_post_model
from src.models.database import get_session

posts_router = APIRouter(prefix="/posts", tags=["Posts"])

@posts_router.post("/create/")
async def create_post(new_post : CreatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await create_new_post(user=user, post=new_post, session=session)

@posts_router.get("/")
async def get_posts(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_all_posts(session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.get("/five_latest/")
async def get_five_latest(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_five_latest_posts(session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.get("/next_post/")
async def get_next_post(current_post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_next_post_after_this(current_post_id=current_post_id, session=session)
    if not res:
        raise HTTPException(status_code=404, detail="This is last post")
    return get_post_by_id_dto(res)

@posts_router.get("/previous_post/")
async def get_previous_post(current_post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_previous_post_from_this(current_post_id=current_post_id, session=session)
    if not res:
        raise HTTPException(status_code=404, detail="This is the first post")
    return get_post_by_id_dto(res)

@posts_router.get("/{id}")
async def get_post_by_id(id: int, session: AsyncSession = Depends(get_session)) -> PostOut:
    post_orm = await get_current_post_by_id(post_id=id, session=session)
    await update_posts_rating_by_post_model(post=post_orm, session=session)
    return get_post_by_id_dto(post=post_orm)

@posts_router.get("/by_user/{user_id}")
async def get_posts_by_current_user(user_id: int, session: AsyncSession = Depends(get_session)) -> list[PostOut]:
    posts_orm = await get_posts_by_user_id(user_id=user_id, session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.get("/top_viewed/")
async def get_top_viewed_posts(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_all_posts_ordered_by_views(session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.get("/top_rated/")
async def get_top_viewed_posts(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_all_posts_ordered_by_rating(session=session)
    return get_all_posts_dto(posts=posts_orm)

@posts_router.patch("/update/")
async def edit_post(post_id: int, edited_post: UpdatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await edit_current_post(post_id=post_id, edited_post=edited_post, session=session)

@posts_router.delete("/delete/")
async def delete_post(post_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await delete_post_by_id(post_id=post_id, session=session)