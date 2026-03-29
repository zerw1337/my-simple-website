import json

import pytest

from src.redis.dependencies import get_cache


@pytest.mark.asyncio
async def test_cache_simple(client_user):
    r = await get_cache()
    await r.delete("five_latest")
    response = await client_user.get("/posts/five_latest/")
    data_db = response.json()
    assert response.status_code == 200
    cached = await r.get("five_latest")
    assert cached is not None
    data_cache = json.loads(cached)
    assert data_db == data_cache

@pytest.mark.asyncio
async def test_cache_update(client_admin):
    r = await get_cache()
    await r.delete("five_latest")
    response = await client_admin.get("/posts/five_latest/")
    data_old = await r.get("five_latest")
    assert response.status_code == 200

    response = await client_admin.post("/posts/create/", json={"content": "cache_test", "title": "cache_test", "category_id": 1})
    assert response.status_code == 201
    data_new = await r.get("five_latest")
    assert data_new is None
    response = await client_admin.get("/posts/five_latest/")
    assert response.status_code == 200
    data_new = await r.get("five_latest")
    assert data_new is not None
    assert data_new != data_old
