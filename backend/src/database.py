import asyncpg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from src.config import settings

async_engine = create_async_engine(settings.DATABASE_URL_asyncpg,
                                   echo=True,
                                   pool_size=10,
                                   max_overflow=5)

async_session_factory = async_sessionmaker(async_engine)

class Base(DeclarativeBase):
    pass

