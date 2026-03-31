import asyncio
import pytest

from src.config import settings
from src.redis.dependencies import get_limiter
from src.models.models import ReactionsEnum


@pytest.mark.asyncio
async def test_rate_limit(client_unauthorized):
    r = await get_limiter()
    async for key in r.scan_iter("rate:*"):
        await r.delete(key)

    for _ in range(settings.LIMITER_LIMIT):
        response = await client_unauthorized.get("/posts/")
        assert response.status_code == 200
    response = await client_unauthorized.get("/posts/")
    assert response.status_code == 429

    async for key in r.scan_iter("rate:*"):
        await r.delete(key)

@pytest.mark.asyncio
async def test_rate_limit_comments(client_user, client_admin):
    r = await get_limiter()
    await r.delete("comments:user:2")
    async for key in r.scan_iter("rate:*"):
        await r.delete(key)

    response = await client_admin.post("/posts/create/", json={"content":"rate_test", "title":"rate_test", "category_id":1})
    assert response.status_code == 201
    data = response.json()
    post_id = data["id"]
    for _ in range(settings.COMMENT_LIMITER_LIMIT):
        response = await client_user.post("/comments/", json={"content":"rate_test", "post_id":post_id})
        assert response.status_code == 201
    response = await client_user.post("/comments/", json={"content":"rate_test", "post_id":post_id})
    data = response.json()
    assert response.status_code == 429
    assert data["detail"] == "Your comment limit per day has been reached"

@pytest.mark.asyncio
async def test_rate_limit_reactions(client_user, client_admin):
    r = await get_limiter()
    await r.delete("reactions:user:2")
    async for key in r.scan_iter("rate:*"):
        await r.delete(key)

    response = await client_admin.post("/posts/create/",
                                       json={"content": "rate_test_reactions", "title": "rate_test_reactions", "category_id": 1})
    assert response.status_code == 201
    data = response.json()
    post_id = data["id"]
    for _ in range(settings.REACTIONS_LIMITER_LIMIT):
        response = await client_user.post("/reactions/", params={"post_id":post_id,"reaction":ReactionsEnum.SAD.value})
        assert response.status_code == 200
    response = await client_user.post("/reactions/", params={"post_id":post_id,"reaction":ReactionsEnum.SAD.value})
    data = response.json()
    assert response.status_code == 429
    assert data["detail"] == "Your reaction limit per day has been reached"



