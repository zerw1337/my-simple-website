import asyncio
import sys
from datetime import datetime

import pytest, pytest_asyncio
from redis.asyncio import Redis
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from Test.config import test_settings
from src.models.models import Users, Categories, Posts
from src.redis import redis_config
from api.auth.dependencies import get_auth, get_auth_new_user, get_auth_admin
from Test.users_test import admin, user, new_user

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

@pytest_asyncio.fixture(autouse=True)
async def use_test_redis(monkeypatch):
    test_cache = Redis(host=test_settings.REDIS_HOST,
                       port=test_settings.REDIS_PORT,
                       db=test_settings.REDIS_DB_CACHE,
                       decode_responses=True)
    test_limiter = Redis(host=test_settings.REDIS_HOST,
                         port=test_settings.REDIS_PORT,
                         db=test_settings.REDIS_DB_LIMITER,
                         decode_responses=True)
    monkeypatch.setattr(redis_config, "r_cache", test_cache)
    monkeypatch.setattr(redis_config, "r_limiter", test_limiter)

@pytest.fixture(scope="session", autouse=True)
def patch_settings():
    with patch("src.config.settings", test_settings), \
         patch("src.models.database.settings", test_settings), \
         patch("api.rate_limiter.limiter.settings", test_settings):
        yield

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database(patch_settings):
    import src.models.database as db_module
    from src.models.database import Base, Database

    test_db = Database(test_settings)
    db_module._db = test_db
    async with test_db.async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with test_db.async_session_factory() as session:
        session.add_all([
            Users(
                id=1,
                username="admin",
                email="admin@mail.ru",
                password="test_hash",
                is_active=True,
                is_banned=False,
                is_superuser=True,
                is_verified=True,
                user_version=1,
                pending_email=None,
            ),
            Users(
                id=2,
                username="user",
                email="321@mail.ru",
                password="test_hash",
                is_active=True,
                is_banned=False,
                is_superuser=False,
                is_verified=True,
                user_version=1,
                pending_email=None,
            ),
            Users(
                id=3,
                username="new_user",
                email="456@mail.ru",
                password="test_hash",
                is_active=True,
                is_banned=False,
                is_superuser=False,
                is_verified=False,
                user_version=1,
                pending_email=None,
            ),
            Categories(
                id=1,
                name="test",
                emoji=":)",
                description="test",
            ),
            Posts(
                title="First post",
                content="First post",
                user_id=1,
                category_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                views=1,
                rating=1,
            )
        ])
        await session.commit()
    yield
    await test_db.async_engine.dispose()

@pytest_asyncio.fixture
async def client_unauthorized():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client

@pytest_asyncio.fixture
async def client_admin():
    from main import app
    app.dependency_overrides[get_auth_admin] = lambda: admin
    async with AsyncClient(transport=ASGITransport(app), base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.pop(get_auth_admin, None)

@pytest_asyncio.fixture
async def client_user():
    from main import app
    app.dependency_overrides[get_auth] = lambda: user
    async with AsyncClient(transport=ASGITransport(app), base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.pop(get_auth, None)

@pytest_asyncio.fixture
async def client_new_user():
    from main import app
    app.dependency_overrides[get_auth_new_user] = lambda: new_user
    async with AsyncClient(transport=ASGITransport(app), base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.pop(get_auth_new_user, None)
