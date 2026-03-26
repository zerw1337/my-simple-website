import pytest
import pytest_asyncio

from Test.conftest import client_unauthorized
from Test.config import test_settings
from api.auth.jwt_payload_operations import get_token_payload

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "creds, exp",
    [
        (
                {"username": "admin", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 200
        ),
        (
                {"username": "user", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 200
        ),
        (
                {"username": "not_existed_username", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 401
        ),
        (
                {"username": "user", "password": "wrong password"}, 401
        ),
        (
            {"username": "ye", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 422
        ),
        (
            {"username": "admin", "password": 123}, 422
        ),
        (
            {"username": "admin", "password": 123456}, 401
        ),
        (
                {"username": "banned", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 200
        ),

    ]
)
async def test_auth_login(client_unauthorized, creds, exp):
    response = await client_unauthorized.post("/auth/login/", data=creds)
    data = response.json()

    assert response.status_code == exp

    if exp == 200:
        access_token_encoded = data["access_token"]
        refresh_token_encoded = data["refresh_token"]
        token_type = data["token_type"]

        assert token_type == "Bearer"

        access_token = get_token_payload(access_token_encoded)
        refresh_token = get_token_payload(refresh_token_encoded)

        assert access_token["username"] == creds["username"]
        assert access_token["type"] == "access"
        assert refresh_token["type"] == "refresh"
        assert refresh_token["username"] == creds["username"]

        if creds["username"] == 'admin':
            assert access_token["is_superuser"] == True
            assert refresh_token["is_superuser"] == True
            assert access_token["is_banned"] == False
        elif creds["username"] == 'user':
            assert access_token["is_superuser"] == False
            assert refresh_token["is_superuser"] == False
            assert access_token["is_banned"] == False
        elif creds["username"] == 'banned':
            assert access_token["is_banned"] == True
            assert refresh_token["is_banned"] == True

    if exp == 401:
        assert "detail" in data
        assert data["detail"] == "Username or password incorrect"

    if exp == 422:
        assert "detail" in data





@pytest.mark.asyncio
@pytest.mark.parametrize(
    "creds, exp",
    [
        (
                {"username": "admin", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 200
        ),
        (
                {"username": "user", "password": str(test_settings.TEST_API_USER_PASSWORD)}, 200
        ),
    ])
async def test_refresh_token(client_unauthorized, creds, exp):
    response = await client_unauthorized.post("/auth/login/", data=creds)
    data = response.json()
    assert response.status_code == 200
    refresh_token_encoded = data["refresh_token"]

    headers = {"Authorization": f"Bearer {refresh_token_encoded}"}
    response = await client_unauthorized.get("/auth/refresh/", headers=headers)
    data = response.json()
    assert response.status_code == 200
    access_token = get_token_payload(data["access_token"])
    assert access_token["username"] == creds["username"]
    assert access_token["type"] == "access"


