import pytest

from Test.conftest import client

@pytest.mark.asyncio
async def test_posts(client):
    resp = await client.get('/posts/')
    assert resp.status_code == 200


