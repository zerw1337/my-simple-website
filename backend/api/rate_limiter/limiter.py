from src.redis.dependencies import get_limiter
from src.config import settings


async def is_limited(ip: str) -> bool:
    key = f"rate:{ip}"
    r = await get_limiter()
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, settings.LIMITER_WINDOW)
    current, _ = await pipe.execute()
    return current > settings.LIMITER_LIMIT



