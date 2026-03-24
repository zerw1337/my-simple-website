import pytest


from Test.conftest import client_admin, client_unauthorized
from api.posts.schemas import CreatePost


@pytest.mark.asyncio
async def test_get_all_posts_list(client_unauthorized):
    resp = await client_unauthorized.get('/posts/')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
@pytest.mark.parametrize(
     "post, exp",
    [
        (CreatePost(
            title="Test Post",
            content="Test Content",
            category_id=1), 200),
        (CreatePost(
            title="Test Post",
            content="Test Content",
            category_id=10000), 403),
    ]
)
async def test_create_post(client_admin, post, exp):
    response = await client_admin.post('/posts/create/', json=post.model_dump())

    assert response.status_code == exp



