import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from fastapi import HTTPException


from api.registration.schemas import CreateUser, CreateProfile
from src.models.models import Users, Profiles
from api.auth.schemas import UserOut


def encode_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf8")

def check_password(hashed_password: str, password: str) -> bool:
    if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        return True
    else:
        return False

async def check_existing_profiles(user: UserOut, session: AsyncSession):
    query = (
        select(Profiles)
        .where(Profiles.user_id == user.id)
    )
    res = await session.execute(query)
    profile = res.scalar_one_or_none()
    if profile:
        raise HTTPException(status_code=403, detail=f"Profile for user with id: {user.id} already exists")

async def create_new_user(user: CreateUser, session: AsyncSession):
    new_user = Users(
        username=user.username,
        email=user.email,
        password= encode_password(user.password))
    session.add(new_user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=403, detail="Username or email already exists")
    return {"success": True}

async def create_new_profile(profile: CreateProfile, user: UserOut, session: AsyncSession):
    await check_existing_profiles(user=user, session=session)
    new_profile = Profiles(
        first_name=profile.first_name,
        last_name=profile.last_name,
        birthday=profile.birthday,
        bio=profile.bio,
        user_id=user.id,
    )
    session.add(new_profile)
    try:
        await session.commit()
    except IntegrityError:
        raise HTTPException(status_code=403, detail="Profile for that user id already exists")




