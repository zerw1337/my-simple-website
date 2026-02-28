from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncIterator
from src.config import settings, Settings


class Database:
    def __init__(self, settings: Settings):
        self.async_engine = create_async_engine(settings.DATABASE_URL_asyncpg,
                                           echo=False,
                                           pool_size=10,
                                           max_overflow=5)

        self.async_session_factory = async_sessionmaker(bind=self.async_engine,
                                                        expire_on_commit=False,
                                                        autocommit=False)

db = Database(settings)

async def get_session() -> AsyncIterator[AsyncSession]:
    async with db.async_session_factory() as session:
        yield session

async def db_dispose():
    await db.async_engine.dispose()

class Base(DeclarativeBase):

    metadata = MetaData(naming_convention=settings.naming_conventions)

