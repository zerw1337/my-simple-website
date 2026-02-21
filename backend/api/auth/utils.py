from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException


from src.models.models import Users
from api.registration.utils import check_password


async def verify_login(login: str, password: str, session: AsyncSession):
    query= (
        select(Users)
        .where(or_(Users.username == login, Users.email == login))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        return await verify_password(hashed_password=result.password, password=password, user=result)
    raise HTTPException(status_code=401, detail="Username or password incorrect")


async def verify_password(hashed_password : str, password: str, user: Users) -> Users:
    if check_password(hashed_password, password):
        return user
    raise HTTPException(status_code=401, detail="Username or password incorrect")

