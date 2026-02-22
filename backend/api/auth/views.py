from fastapi import APIRouter, Form, Depends,  HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.utils import verify_login
from src.models.database import get_session
from .jwt import create_access_token, create_refresh_token
from .auth_validation import get_current_user
from .schemas import Token, UserOut, token_fields
from .jwt_payload_operations import validate_token_type, get_token_payload

auth_router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@auth_router.post("/login/", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...), session: AsyncSession = Depends(get_session)):
    user = await verify_login(login=username, password=password, session=session)
    return Token(access_token=create_access_token(id=str(user.id), username=user.username),
                 refresh_token=create_refresh_token(id=user.id, username=user.username))

@auth_router.get("/me/", response_model=UserOut)
async def validate_user(token: str = Depends(oauth2_scheme) ,session: AsyncSession = Depends(get_session)):
    return await get_current_user(token=token, session=session)

@auth_router.get("/refresh/", response_model=Token)
async def get_new_access_token_by_refresh(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)):
    decoded = get_token_payload(encoded_jwt=token)
    validate_token_type(payload=decoded, expected_type=token_fields.REFRESH_TOKEN_FIELD)
    user = await get_current_user(token=token, session=session)
    return Token(access_token=create_access_token(id=str(user.id), username=user.username), refresh_token=token)