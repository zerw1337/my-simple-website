import pytest


from Test.conftest import client_admin, client_unauthorized



@pytest.mark.asyncio
@pytest.mark.parametrize(
     "post, exp",
    [
        (
               {"title": "Test Post", "content": "Test Content", "category_id": 1}, 201
        ),
        (
                {"title": "Test Post", "content": "Test Content", "category_id": 10000}, 403
        ),
        (
                {"title": "d", "content": "Test Content", "category_id": 1}, 422
        ),
        (
                {"title": "Test Post", "content": "", "category_id": 1}, 422
        ),
        (
                {"title": 123456789, "content": "Test Content", "category_id": 1}, 422
        ),
        (
                {"title": "Test Post", "content": 1234545678, "category_id": 1}, 422
        ),

    ]
)
async def test_create_post(client_admin, post, exp):
    response = await client_admin.post('/posts/create/', json=post)

    data = response.json()
    if exp == 201:
        assert isinstance(data, dict)
        assert data.get("title") == post["title"]
        assert data.get("content") == post["content"]
        assert isinstance(data["category"], dict)
        assert isinstance(data["user"], dict)

    if exp == 403:
        assert isinstance(data, dict)
        assert "detail" in data

    if exp == 422:
        assert isinstance(data, dict)
        assert "detail" in data


@pytest.mark.asyncio
@pytest.mark.parametrize(
     "post, exp",
    [
        (
                {"title": "Test Post", "content": "Test Content", "category_id": 1}, 401
        ),
    ]
)
async def test_create_post_by_user(client_user, post, exp):
    response = await client_user.post('/posts/create/', json=post)

    data = response.json()
    detail = data.get("detail")

    assert response.status_code == exp
    assert isinstance(data, dict)
    assert "detail" in data
    assert detail ==  "Not authenticated"



@pytest.mark.asyncio
@pytest.mark.parametrize(
     "post, exp",
    [
        (
                {"title": "Test Post", "content": "Test Content", "category_id": 1}, 401
        ),
    ]
)
async def test_create_post_unauthorized(client_unauthorized, post, exp):
    response = await client_unauthorized.post('/posts/create/', json=post)

    data = response.json()
    detail = data.get("detail")

    assert response.status_code == exp
    assert isinstance(data, dict)
    assert "detail" in data
    assert detail ==  "Not authenticated"



@pytest.mark.asyncio
@pytest.mark.parametrize(
     "post_id, updated, exp",
    [
        (
                1,
                {"title": "Updated", "content": "Updated", "category_id": 1},
                200
        ),
        (
                1,
                {"title": 123, "content": "Updated", "category_id": 1},
                422
        ),
        (
                1,
                {"title": "Updated", "content": 12345678900898776, "category_id": 1},
                422
        ),
    ]
)
async def test_update_post(client_admin, post_id, updated, exp):
    response = await client_admin.patch('/posts/update/', params={"post_id":post_id}, json=updated)

    data = response.json()

    assert response.status_code == exp

    if exp == 200:
        assert isinstance(data, dict)
        assert "title" in data
        assert  "content" in data
        assert "category" in data
        assert data.get("title") == updated["title"]
        assert data.get("content") == updated["content"]

    if exp == 422:
        assert isinstance(data, dict)
        assert "detail" in data

@pytest.mark.asyncio
async def test_delete_post(client_admin, post_id: int = 1):
    response = await client_admin.get(f'/posts/{post_id}', params={"post_id":1})
    data = response.json()
    assert response.status_code == 200
    assert data.get("title") == "Updated"
    assert data.get("content") == "Updated"
    assert data["category"]["id"] == 1

    response = await client_admin.delete('/posts/delete/', params={"post_id":1})
    data = response.json()
    assert response.status_code == 200
    assert data["status"] == "Post deleted"

    response = await client_admin.get(f'/posts/{post_id}', params={"post_id":1})
    data = response.json()
    assert response.status_code == 404
    assert data.get("detail") == "Post not found"











