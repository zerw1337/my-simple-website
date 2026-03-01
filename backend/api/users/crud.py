from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from api.auth.schemas import UserOut
from src.models.models import Users
from api.registration.utils import encode_password
from api.auth.token_database_operations import remove_old_token

async def change_current_user_password(new_password: str, in_user: UserOut,session: AsyncSession):
    query = (
        select(Users)
        .where(Users.id == in_user.id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    new_pwd_encoded = encode_password(new_password)
    setattr(result, "password", new_pwd_encoded)
    setattr(result, "user_version", result.user_version+1)
    await remove_old_token(user_id=in_user.id, session=session)
    await session.commit()
    return {"success": True}

async def change_current_user_pending_email(new_email: EmailStr, in_user: UserOut, session: AsyncSession):
    query = (
        select(Users)
        .where(Users.id == in_user.id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    if result.email != new_email:
        setattr(result, "pending_email", new_email)
        # setattr(result, "user_version", result.user_version+1)
        # await remove_old_token(user_id=in_user.id, session=session)
        await session.commit()
        return {"success": True}
    raise HTTPException(status_code=403, detail="New email is the same as old one")

async def change_current_user_email(in_user: UserOut, session: AsyncSession):
    query = (
        select(Users)
        .where(Users.id == in_user.id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    setattr(result, "email", result.pending_email)
    setattr(result, "user_version", result.user_version+1)
    await remove_old_token(user_id=in_user.id, session=session)
    await session.commit()
    return {"success": True}
