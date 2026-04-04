from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from api.auth.schemas import UserOut
from src.models.models import Users, PasswordChangeUrls
from api.registration.utils import check_password, encode_password


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

async def check_if_this_account_exists_via_email(email: str, session: AsyncSession) -> Users:
    query= (
        select(Users)
        .where(Users.email == email)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    return result

async def upload_password_change_link_to_db(url: str, user: Users, session: AsyncSession):
    new = PasswordChangeUrls(url=url, user_id=user.id)
    query = (
        select(PasswordChangeUrls)
        .where(PasswordChangeUrls.user_id == user.id)
    )
    res = await session.execute(query)
    result = res.scalars().all()
    if result:
        for url in result:
            await session.delete(url)
    session.add(new)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Password change link already exists")

async def  check_if_this_url_password_change_exists(url: str, session: AsyncSession) -> PasswordChangeUrls:
    query= (
        select(PasswordChangeUrls)
        .where(PasswordChangeUrls.url == url)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    return result

async def change_users_password_via_url(url: PasswordChangeUrls, new_password: str, session: AsyncSession):
    query= (
        select(Users)
        .where(Users.id == url.user_id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    hashed = encode_password(new_password)
    result.password = hashed
    session.add(result)
    try:
        await session.delete(url)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Password change went wrong")



