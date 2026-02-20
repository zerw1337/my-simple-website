import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from pydantic import EmailStr

from api.registration.schemas import CreateUser
from src.models.models import Users


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf8")

async def create_new_user(user: CreateUser, session: AsyncSession):
    new_user = Users(
        username=user.username,
        email=user.email,
        password= hash_password(user.password))
    session.add(new_user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Username or email already exists")
    return {"success": True}
