from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis


from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.posts.crud import create_new_post, get_all_posts, get_current_post_by_id, edit_current_post, delete_post_by_id, \
    get_posts_by_user_id, \
    get_all_posts_ordered_by_views, get_all_posts_ordered_by_rating, get_post_images_by_post_id, get_posts_paginated, \
    get_posts_ordered_by_views_paginated, get_posts_ordered_by_rating_paginated, get_posts_by_category_pag, \
    get_posts_by_user_paginated
from api.posts.dto import get_all_posts_dto, get_post_by_id_dto
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from src.minio.config import get_minio
from src.models.database import get_session
from src.redis.dependencies import get_cache
from src.config import settings

posts_router = APIRouter(prefix="/posts", tags=["Posts"])

@posts_router.post("/create/", response_model=PostOut, status_code=201, summary="Создать пост")
async def create_post(title: str = Form(...),
                      content: str = Form(...),
                      category_id: int = Form(...),
                      img1: UploadFile | None = File(None),
                      img2: UploadFile | None = File(None),
                      img3: UploadFile | None = File(None),
                      img4: UploadFile | None = File(None),
                      img5: UploadFile | None = File(None),
                      img6: UploadFile | None = File(None),
                      img7: UploadFile | None = File(None),
                      img8: UploadFile | None = File(None),
                      img9: UploadFile | None = File(None),
                      img10: UploadFile | None = File(None),
                      user: UserOut = Depends(get_auth_admin),
                      session: AsyncSession = Depends(get_session),
                      minio = Depends(get_minio),
                      r: Redis = Depends(get_cache)):
    try:
        new_post = CreatePost(title=title, content=content, category_id=category_id)
    except ValidationError:
        raise HTTPException(status_code=400, detail="Validation error")
    imgs: list[UploadFile] = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10]
    new_post = await create_new_post(user=user, post=new_post, imgs=imgs, session=session, minio=minio)
    await r.delete("five_latest")
    await r.delete("all_posts")
    await r.delete(f"posts_by_user/{user.id}")
    return get_post_by_id_dto(new_post)

@posts_router.get("/", response_model=list[PostOut], summary="ГЕТ все посты")
async def get_posts(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get("all_posts")
    if cached:
        return json.loads(cached)
    posts_orm = await get_all_posts(session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set("all_posts", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
    return posts_dto

@posts_router.get("/paginated")
async def get_posts_pag(limit: int = 10, session: AsyncSession = Depends(get_session), current_post: int | None = None):
    posts_orm = await get_posts_paginated(current_post=current_post, limit=limit, session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    return posts_dto

@posts_router.get("/by_user/{user_id}", response_model=list[PostOut], summary="GET все посты данного пользователя по user_id")
async def get_posts_by_current_user(user_id: int, session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)) -> list[PostOut]:
    cached = await r.get(f"posts_by_user/{user_id}")
    if cached:
        return json.loads(cached)
    posts_orm = await get_posts_by_user_id(user_id=user_id, session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set(f"posts_by_user/{user_id}", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
    return posts_dto

@posts_router.get("/by_user/{user_id}/paginated",)
async def get_posts_by_user_pag(user_id: int, offset: int | None = None, limit: int = 10, session: AsyncSession = Depends(get_session)):
    posts_orm = await get_posts_by_user_paginated(user_id=user_id, session=session, offset=offset, limit=limit)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    return posts_dto

@posts_router.get("/by_category/{category_id}/paginated")
async def get_posts_by_cat_paginated(category_id: int, offset: int | None = None, limit: int = 10, session: AsyncSession = Depends(get_session)):
    posts_orm = await get_posts_by_category_pag(category_id=category_id, offset=offset, limit=limit, session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    return posts_dto


@posts_router.get("/top_viewed/", response_model=list[PostOut], summary="GET все посты отсортированные по просмотрам (Убывание)")
async def get_top_viewed_posts(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get("top_viewed_posts")
    if cached:
        return json.loads(cached)
    posts_orm = await get_all_posts_ordered_by_views(session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set("top_viewed_posts", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
    return posts_dto

@posts_router.get("/top_viewed/paginated/")
async def get_top_viewed_posts_pag(limit: int = 10, session: AsyncSession = Depends(get_session), offset: int | None = None):
    posts_orm = await get_posts_ordered_by_views_paginated(session=session, limit=limit, offset=offset)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    return posts_dto

@posts_router.get("/top_rated/", response_model=list[PostOut], summary="GET все посты отсортированные по рейтингу (Убывание)")
async def get_top_rated_posts(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get("top_rated_posts")
    if cached:
        return json.loads(cached)
    posts_orm = await get_all_posts_ordered_by_rating(session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set("top_rated_posts", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
    return posts_dto

@posts_router.get("/top_rated/paginated/")
async def get_top_rated_posts_pag(limit: int = 10, session: AsyncSession = Depends(get_session), offset: int | None = None):
    posts_orm = await get_posts_ordered_by_rating_paginated(session=session, limit=limit, offset=offset)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    return posts_dto

@posts_router.get("/{id}", response_model=PostOut, summary="ГЕТ пост по айди поста")
async def get_post_by_id(id: int, session: AsyncSession = Depends(get_session)) -> PostOut:
    post_dto = await get_current_post_by_id(post_id=id, session=session)
    return post_dto

@posts_router.get("/{post_id}/images/")
async def get_post_images(post_id: int, session: AsyncSession = Depends(get_session), minio = Depends(get_minio)):
    images = await get_post_images_by_post_id(post_id=post_id, session=session, minio=minio)
    return images

@posts_router.patch("/update/", response_model=PostOut, summary="Патч поста, на вход поля которые изменить в посте")
async def edit_post(post_id: int, edited_post: UpdatePost, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    updated = await edit_current_post(post_id=post_id, edited_post=edited_post, session=session)
    await r.delete("all_posts")
    await r.delete("five_latest")
    result = get_post_by_id_dto(post=updated)
    return result

@posts_router.delete("/delete/", summary="Удалить пост")
async def delete_post(post_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
     await delete_post_by_id(post_id=post_id, session=session)
     await r.delete("five_latest")
     await r.delete("all_posts")
     return {"status": "Post deleted"}