import pytest


@pytest.mark.asyncio
@pytest.mark.parametrize("category, exp",
                         [
                             ({"name":"test_cat1", "emoji":":)", "description":"test_cat1"}, 201),
                            ({"name":"test_cat1", "emoji":"💭", "description":"test_cat1"}, 201),
                            ({"name":1, "emoji":"💭", "description":"test_cat1"}, 422),
                            ({"name":"test_cat1", "emoji":"💭", "description":2131}, 422),

                         ])
async def test_create_categories(client_admin, category, exp):
    response = await client_admin.post("/categories/", json=category)

    if exp == 200:
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == category["name"]
        assert data["description"] == category["description"]
        assert data["emoji"] == category["emoji"]
    if exp == 422:
        assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize("updated, exp",
                         [
                             ({"name": "upd", "emoji": ":(", "description": "upd"}, 201),

                         ])
async def test_patch_categories(client_admin, updated, exp):
    response = await client_admin.patch("/categories/1", json=updated, params={"category_id":1})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == updated["name"]
    assert data["description"] == updated["description"]
    assert data["emoji"] == updated["emoji"]

