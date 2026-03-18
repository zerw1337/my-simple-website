from redis.asyncio import Redis
from typing import Optional

from src.config import settings

r_cache: Optional[Redis] = None
r_limiter: Optional[Redis] = None

async def init_redis():
    global r_cache, r_limiter
    r_cache = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB_CACHE,
        decode_responses=True
    )
    r_limiter = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB_LIMITER,
        decode_responses=True
    )

async def close_redis():
    global r_cache, r_limiter
    if r_cache:
        await r_cache.close()
        r_cache = None
    if r_limiter:
        await r_limiter.close()
        r_limiter = None

