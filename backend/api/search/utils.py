from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from api.categories.dto import validate_categories_list
from api.posts.dto import get_all_posts_dto
from api.search.dto import search_posts_dto, search_users_dto, search_categories_dto
from api.users.dto import get_all_users_list_dto
from src.models.models import Users, Categories, Posts


async def get_search(q: str | None, session: AsyncSession):
    if not q:
        return {
            "users": [],
            "categories": [],
            "posts": []
        }
    query = (
        select(Users)
        .where(Users.username.ilike(f"{q}%"))
        .limit(10)
    )
    res = await session.execute(query)
    users_orm = res.scalars().all()
    query = (
        select(Categories)
        .where(Categories.name.ilike(f"%{q}%"))
        .limit(5)
    )
    res = await session.execute(query)
    categories_orm = res.scalars().all()
    query = (
        select(Posts)
        .where(or_(Posts.title.ilike(f"%{q}%"), Posts.content.ilike(f"%{q}%")))
        .limit(10)
    )
    res = await session.execute(query)
    posts_orm = res.scalars().all()

    if users_orm is None:
        users_dto = None
    else:
        users_dto = search_users_dto(users_orm)

    if categories_orm is None:
        categories_dto = None
    else:
        categories_dto = search_categories_dto(categories_orm)

    if posts_orm is None:
        posts_dto = None
    else:
        posts_dto = search_posts_dto(posts_orm)

    return {
        "users": users_dto,
        "categories": categories_dto,
        "posts": posts_dto
    }







