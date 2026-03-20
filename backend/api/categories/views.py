from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
import json
from redis.asyncio import Redis

from api.auth.dependencies import get_auth_admin
from api.auth.schemas import UserOut
from api.categories.crud import get_categories, create_category, edit_category_by_id, delete_category_by_id, get_category_by_id
from api.categories.schemas import Category, CreateCategory, EditCategory
from src.models.database import get_session
from src.redis.dependencies import get_cache
from src.config import settings

cat_router = APIRouter(prefix="/categories", tags=["Categories"])

@cat_router.get("/", response_model=list[Category])
async def get_all_categories(session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)) -> list[Category]:
    cached = await r.get("all_categories")
    if cached:
        return json.loads(cached)
    categories = await get_categories(session=session)
    await r.set("all_categories", json.dumps([c.model_dump(mode="json") for c in categories]), ex=settings.CACHE_EXPIRE)
    return categories

@cat_router.get("/{id}", response_model=Category)
async def get_category(id: int = Path(gt=0, lt=100), session: AsyncSession = Depends(get_session)) -> list[Category]:
    return await get_category_by_id(id=id, session=session)

@cat_router.post("/")
async def create_new_category(in_cat: CreateCategory, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    await create_category(in_cat=in_cat, session=session)
    await r.delete("all_categories")
    return {"success": True}

@cat_router.patch("/{category_id}")
async def edit_category(updated: EditCategory, category_id: int = Path(gt=0, lt=100), user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    await edit_category_by_id(id=category_id, updated=updated, session=session)
    await r.delete("all_categories")
    return {"success": True}

@cat_router.delete("/{category_id}")
async def delete_category(category_id: int = Path(gt=0, lt=100), user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r: Redis = Depends(get_cache)):
    await delete_category_by_id(id=category_id, session=session)
    await r.delete("all_categories")
    return {"success": True}