import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_
from fastapi import HTTPException

from api.SMTP.utils import generate_verify_code
from api.registration.schemas import CreateUser, CreateProfile
from src.models.models import Users, Profiles, VerifyCodes, VerifyCodesEnum
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
    from api.users.crud import check_if_email_is_already_taken
    await check_if_email_is_already_taken(email=user.email, session=session)
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


async def check_if_current_users_verify_code_exists(code_type: VerifyCodesEnum, user: CreateUser | UserOut, session: AsyncSession):
    query = (
        select(Users)
        .where(Users.username == user.username)
    )
    res = await session.execute(query)
    current_user = res.scalar_one_or_none()
    if not current_user:
        raise HTTPException(status_code=403, detail=f"User {user.username} does not exist")
    query = (
        select(VerifyCodes)
        .where(and_(VerifyCodes.user_id == current_user.id, VerifyCodes.type == code_type))
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if result:
        await session.delete(result)
    return True


async def upload_verify_code_to_database(code: int, code_type: VerifyCodesEnum, session: AsyncSession, user: CreateUser | UserOut):
    query = (
        select(Users)
        .where(Users.username == user.username)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if  not result:
        raise HTTPException(status_code=404, detail="User not found")
    new_code = VerifyCodes(
        user_id=result.id,
        code=code,
        type=code_type
    )
    await check_if_current_users_verify_code_exists(code_type=code_type, user=user, session=session)
    session.add(new_code)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        code = generate_verify_code()
        await upload_verify_code_to_database(code=code, session=session, user=user)
    return {"success": True}


async def verify_new_user_via_code(code: int, session: AsyncSession, user: UserOut):
    query = (
        select(VerifyCodes)
        .where(and_(VerifyCodes.code == code, VerifyCodes.type == VerifyCodesEnum.registration, VerifyCodes.user_id == user.id))
    )
    res = await session.execute(query)
    verify_code = res.scalar_one_or_none()
    if not verify_code:
        raise HTTPException(status_code=403, detail="Verification code is wrong!")
    query = (
        select(Users)
        .where(Users.id == user.id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result.is_verified = True
    await session.delete(verify_code)
    await session.commit()
    return True

async def verify_email_change_via_code(code: int, session: AsyncSession, user: UserOut):
    query = (
        select(VerifyCodes)
        .where(and_(VerifyCodes.code == code, VerifyCodes.type == VerifyCodesEnum.manage_account, VerifyCodes.user_id == user.id))
    )
    res = await session.execute(query)
    verify_code = res.scalar_one_or_none()
    if not verify_code:
        raise HTTPException(status_code=403, detail="Verification code is wrong!")
    query = (
        select(Users)
        .where(Users.id == user.id)
    )
    res = await session.execute(query)
    result = res.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result.email = result.pending_email
    result.pending_email = None
    result.user_version += 1
    await session.delete(verify_code)
    await session.commit()







