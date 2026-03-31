import pytest



@pytest.mark.asyncio
@pytest.mark.parametrize("comment, exp",
                         [
                             ({"content":"test", "post_id":1}, 201),
                         ])
async def test_post_comments(client_user, comment, exp):
    response = await client_user.post("/comments/", json=comment)
    assert response.status_code == exp
    data = response.json()
    assert data["content"] == comment["content"]
    assert data["post_id"] == comment["post_id"]
    assert "user" in data
    assert data["user"]["id"] == 2

@pytest.mark.asyncio
async def test_delete_comments(client_user):
    response = await client_user.delete("/comments/1/")
    assert response.status_code == 200
