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

async def is_limited_comments(user_id: int) -> bool:
    key = f"comments:user:{user_id}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.COMMENT_LIMITER_WINDOW)
    return current > settings.COMMENT_LIMITER_LIMIT

async def is_limited_reactions(user_id: int) -> bool:
    key = f"reactions:user:{user_id}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.REACTIONS_LIMITER_WINDOW)
    return current > settings.REACTIONS_LIMITER_LIMIT



