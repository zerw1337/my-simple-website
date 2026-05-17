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
    key = f"comments:{user_id}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.COMMENT_LIMITER_WINDOW)
    return current > settings.COMMENT_LIMITER_LIMIT

async def is_limited_reactions(user_id: int) -> bool:
    key = f"reactions:{user_id}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.REACTIONS_LIMITER_WINDOW)
    return current > settings.REACTIONS_LIMITER_LIMIT

async def is_limited_password_change(ip: str) -> bool:
    key = f"change_password:{ip}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.CHANGE_PASSWORD_LIMITER_WINDOW)
    return current > settings.CHANGE_PASSWORD_LIMITER_LIMIT

async def is_limited_smtp_service(ip: str) -> bool:
    key = f"smtp_service:{ip}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.SMTP_SERVICE_LIMITER_WINDOW)
    return current > settings.SMTP_SERVICE_LIMITER_LIMIT

async def is_limited_avatar_upload(user_id: int) -> bool:
    key = f"avatar:{user_id}"
    r = await get_limiter()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, settings.AVATAR_LIMITER_WINDOW)
    return current > settings.AVATAR_LIMITER_LIMIT



