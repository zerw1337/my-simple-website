import pytest, pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from Test.config import test_settings
from src.models.database import get_db as db

@pytest.fixture(scope="session", autouse=True)
def patch_settings():
    with patch("src.config.settings", test_settings), \
         patch("src.models.database.settings", test_settings), \
         patch("api.rate_limiter.limiter.settings", test_settings):
        yield

@pytest.fixture(scope="session")
async def prepare_database(patch_settings):
    from src.models.database import Base
    async with db().async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        yield


@pytest_asyncio.fixture(scope="session")
async def client(patch_settings, prepare_database):
    from main import app
    from src.redis.redis_config import init_redis, close_redis

    await init_redis()
    async with AsyncClient(transport=ASGITransport(app), base_url="http://127.0.0.1:8000") as client:
        yield client

    try:
        await close_redis()
    except RuntimeError as e:
        if "Event loop is closed" not in str(e):
            raise
