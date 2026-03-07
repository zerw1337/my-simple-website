from fastapi import APIRouter, Form, Depends,  HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.utils import verify_login
from src.models.database import get_session
from .jwt import create_access_token, create_refresh_token
from .auth_validation import get_current_user
from .schemas import Token, UserOut, token_fields, AccessToken, RefreshToken
from .jwt_payload_operations import validate_token_type, get_token_payload
from .token_database_operations import submit_refresh_token
from .token_database_operations import validate_refresh_token_by_db

auth_router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@auth_router.post("/login/", response_model=Token, summary="Выполнить вход в учетную запись, возвращает access+refresh токены")
async def login(username: str = Form(...), password: str = Form(...), session: AsyncSession = Depends(get_session)):
    user = await verify_login(login=username, password=password, session=session)
    access_token = create_access_token(id=str(user.id), username=user.username, user_version=user.user_version, user=user)
    refresh_token = create_refresh_token(id=user.id, username=user.username, user_version=user.user_version, user=user)
    await submit_refresh_token(token=refresh_token, session=session)
    token = Token(access_token=access_token, refresh_token=refresh_token, user=user.username)
    return token

@auth_router.get("/refresh/", response_model=AccessToken, summary="Получить access token, срок жизни 15 минут")
async def get_new_access_token_by_refresh(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)):
    decoded = get_token_payload(encoded_jwt=token)
    validate_token_type(payload=decoded, expected_type=token_fields.REFRESH_TOKEN_FIELD)
    await validate_refresh_token_by_db(token=decoded, session=session)
    user = await get_current_user(token=token, session=session)
    token = AccessToken(access_token=create_access_token(id=str(user.id), username=user.username, user_version=user.user_version))
    return token

