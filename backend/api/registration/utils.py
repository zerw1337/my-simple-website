import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession

from api.registration.schemas import CreateUser
from src.models.models import Users




async def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf8")

async def create_user(username: str, email: str, password: str, session: AsyncSession):
    new = CreateUser(
        login=username,
        email=email,
        password=password,
    )
    return await create_new_user(user=new, session=session)

async def create_new_user(user: CreateUser, session: AsyncSession):
    new_user = Users(
        username=user.login,
        email=user.email,
        password= await hash_password(user.password))
    session.add(new_user)
    await session.commit()
    return {"success": True}
