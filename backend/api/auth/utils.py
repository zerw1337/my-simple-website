from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException


from src.models.models import Users
from api.registration.utils import check_password


async def login_username_validate(login: str, password: str, session: AsyncSession):
    query= (
        select(Users)
        .where(or_(Users.username == login, Users.email == login))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        return await validate_login_and_password(hashed_password=result.password, password=password)
    raise HTTPException(status_code=401, detail="Username or password incorrect")


async def validate_login_and_password(hashed_password : str, password: str) -> bool:
    if check_password(hashed_password, password):
        return True
    else:
        raise HTTPException(status_code=401, detail="Username or password incorrect")

