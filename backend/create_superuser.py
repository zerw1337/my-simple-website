import asyncio
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_

from api.registration.utils import encode_password
from src.models.models import Users
from src.models.database import get_db



async def create_superuser():
    db = get_db()
    async with db.async_session_factory() as session:
        username = input("Username: ")
        password = input("Password: ")
        email = input("Email address: ")
        admin = Users(
            username=username,
            email=email,
            password=encode_password(password),
            is_superuser=True,
            is_active=True,
            is_verified=True,
            is_banned=False,
            user_version=1,
            pending_email=None,
        )
        query = (
            select(Users)
            .where(and_(Users.username==username, Users.email == email, Users.is_superuser == True))
        )
        res = await session.execute(query)
        result = res.scalar_one_or_none()
        if result is None:
            session.add(admin)
            try:
                await session.commit()
                print(f"Superuser {username} successfully created")
            except IntegrityError:
                await session.rollback()
                print("failed to create superuser")
        else:
            print(f"Superuser {username} already exists")
        return print("finished creating superuser")

if __name__ == "__main__":
    asyncio.run(create_superuser())