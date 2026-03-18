from src.redis.redis_config import r_cache, r_limiter


async def get_cache():
    if not r_cache:
        raise RuntimeError("Redis cache not initialized")
    return r_cache

async def get_limiter():
    if not r_limiter:
        raise RuntimeError("Redis limit not initialized")
    return r_limiter
