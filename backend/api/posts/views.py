from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis


from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.posts.crud import create_new_post, get_all_posts, get_current_post_by_id, edit_current_post, delete_post_by_id, \
    get_five_latest_posts, get_next_post_after_this, get_previous_post_from_this, get_posts_by_user_id, \
    get_all_posts_ordered_by_views, get_all_posts_ordered_by_rating, get_post_images_by_post_id
from api.posts.dto import get_all_posts_dto, get_post_by_id_dto
from api.posts.schemas import CreatePost, PostOut, UpdatePost
from api.posts_rating.utils import update_posts_rating_by_post_model, update_posts_rating_by_post_id
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

@posts_router.get("/five_latest/", response_model=list[PostOut], summary="GET 5 последних постов")
async def get_five_latest(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get("five_latest")
    if cached:
        return json.loads(cached)
    posts_orm = await get_five_latest_posts(session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set("five_latest", json.dumps([p.model_dump(mode="json") for p in posts_dto]))
    return posts_dto

@posts_router.get("/next_post/", response_model=PostOut, summary="GET пост следующий после введенного current_post_id")
async def get_next_post(current_post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_next_post_after_this(current_post_id=current_post_id, session=session)
    if not res:
        raise HTTPException(status_code=404, detail="This is last post")
    post_dto = get_post_by_id_dto(post=res)
    return post_dto

@posts_router.get("/previous_post/", response_model=PostOut, summary="GET предыдущий пост введенного current_post_id")
async def get_previous_post(current_post_id: int, session: AsyncSession = Depends(get_session)):
    res = await get_previous_post_from_this(current_post_id=current_post_id, session=session)
    if not res:
        raise HTTPException(status_code=404, detail="This is the first post")
    post_dto = get_post_by_id_dto(post=res)
    return post_dto


@posts_router.get("/by_user/{user_id}", response_model=list[PostOut], summary="GET все посты данного пользователя по user_id")
async def get_posts_by_current_user(user_id: int, session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)) -> list[PostOut]:
    cached = await r.get(f"posts_by_user/{user_id}")
    if cached:
        return json.loads(cached)
    posts_orm = await get_posts_by_user_id(user_id=user_id, session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set(f"posts_by_user/{user_id}", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
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

@posts_router.get("/top_rated/", response_model=list[PostOut], summary="GET все посты отсортированные по рейтингу (Убывание)")
async def get_top_rated_posts(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    cached = await r.get("top_rated_posts")
    if cached:
        return json.loads(cached)
    posts_orm = await get_all_posts_ordered_by_rating(session=session)
    posts_dto = get_all_posts_dto(posts=posts_orm)
    await r.set("top_rated_posts", json.dumps([p.model_dump(mode="json") for p in posts_dto]), ex=settings.CACHE_EXPIRE)
    return posts_dto

@posts_router.get("/{id}", response_model=PostOut, summary="ГЕТ пост по айди поста")
async def get_post_by_id(id: int, session: AsyncSession = Depends(get_session)) -> PostOut:
    post_orm = await get_current_post_by_id(post_id=id, session=session)
    await update_posts_rating_by_post_model(post=post_orm, session=session)
    post_dto = get_post_by_id_dto(post=post_orm)
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