import pytest

from Test.config import test_settings
from Test.conftest import client_unauthorized, client_user
from api.auth.jwt_payload_operations import get_token_payload



@pytest.mark.asyncio
@pytest.mark.parametrize("creds, exp",
                         [
                             ({
                                    "username": "zerw1337",
                                    "email": "zerw1337@zerw1337.ru",
                                    "password": "qwerty",
                                }, 200),
                                ({
                                    "username": "zerw1337",
                                    "email": "zerw@zerw1337.ru",
                                    "password": "qwerty",
                                }, 403),
                                ({
                                    "username": "zerw",
                                    "email": "zerw1337@zerw1337.ru",
                                    "password": "qwerty",
                                }, 403),
                                ({
                                    "username": "ye",
                                    "email": "vfdsvse@zerw1337.ru",
                                    "password": "qwerty",
                                }, 422),
                                ({
                                    "username": "unique",
                                    "email": "zerw@zerw1337",
                                    "password": "qwerty",
                                }, 422),

                         ])
async def test_registration_unauthorized(client_unauthorized, creds, exp):
    response = await client_unauthorized.post("/register/", data=creds)
    data = response.json()

    assert response.status_code == exp

    if exp == 200:
        access_token = get_token_payload(data["access_token"])
        refresh_token = get_token_payload(data["refresh_token"])

        assert access_token["username"] == creds["username"]
        assert access_token["type"] == "access"
        assert access_token["is_superuser"] == False
        assert access_token["is_verified"] == False
        assert access_token["is_banned"] == False
        assert access_token["user_version"] == "1"
        assert "sub" in access_token
        assert "iat" in access_token
        assert "exp" in access_token
        assert refresh_token["username"] == creds["username"]
        assert refresh_token["type"] == "refresh"
        assert "tid" in refresh_token

    if exp == 403:
        assert "detail" in data

    if exp == 422:
        assert "detail" in data


@pytest.mark.asyncio
@pytest.mark.parametrize("creds, exp",
                         [
                             ({
                                    "username": "auth_register",
                                    "email": "auth_register@zerw1337.ru",
                                    "password": "qwerty",
                                }, 403),

                         ])
async def test_registration_user(client_user, creds, exp):
    response = await client_user.post("/auth/login/", data={"username": "user", "password": test_settings.TEST_API_USER_PASSWORD})
    data = response.json()
    header = {"Authorization": f"Bearer {data['access_token']}"}
    response = await client_user.post("/register/", data=creds, headers=header)
    data = response.json()

    assert response.status_code == exp

    if exp == 403:
        assert "detail" in data







