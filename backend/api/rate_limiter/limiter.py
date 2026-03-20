from src.redis.dependencies import get_limiter
from src.config import settings


async def is_limited(ip: str) -> bool:
    r = await get_limiter()
    key = f"rate:{ip}"
    current = await r.incr(key)

    if current == 1:
        await r.expire(key, settings.LIMITER_WINDOW)

    return current > settings.LIMITER_LIMIT



