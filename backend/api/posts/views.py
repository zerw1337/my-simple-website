from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.posts.crud import create_new_post, get_all_posts
from api.posts.dto import get_all_posts_dto
from api.posts.schemas import CreatePost
from src.models.database import get_session

posts_router = APIRouter(prefix="/posts", tags=["Posts"])

@posts_router.post("/create/")
async def create_post(new_post : CreatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    return await create_new_post(user=user, post=new_post, session=session)

@posts_router.get("/")
async def get_posts(session: AsyncSession = Depends(get_session)):
    posts_orm = await get_all_posts(session=session)
    return get_all_posts_dto(posts=posts_orm)