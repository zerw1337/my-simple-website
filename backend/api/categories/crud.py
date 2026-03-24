from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from api.categories.dto import validate_categories_list, validate_category
from api.categories.schemas import CreateCategory, EditCategory
from src.models.models import Categories


async def get_categories(session: AsyncSession):
    query = (
        select(Categories)
        .order_by(Categories.id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    return validate_categories_list(in_cats=result)

async def get_category_by_id(id:int, session: AsyncSession):
    query = (
        select(Categories)
        .where(Categories.id == id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        return validate_category(in_cat=result)
    raise HTTPException(status_code=404, detail="Category not found")

async def create_category(in_cat: CreateCategory, session: AsyncSession):
    new = Categories(**in_cat.model_dump())
    session.add(new)
    await session.commit()

async def edit_category_by_id(id: int, updated: EditCategory, session: AsyncSession):
    query = (
        select(Categories)
        .where(Categories.id == id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        for name, val in updated.model_dump().items():
            setattr(result, name, val)
        session.add(result)
        await session.commit()
        return {"success": True}
    raise HTTPException(status_code=404, detail="Category not found")

async def delete_category_by_id(id: int, session: AsyncSession):
    query = (
        select(Categories)
        .where(Categories.id == id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        await session.delete(result)
        await session.commit()
        return {"success": True}
    raise HTTPException(status_code=404, detail="Category not found")
