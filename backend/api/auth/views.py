from fastapi import APIRouter, Form, Depends,  HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.utils import verify_login
from src.models.database import get_session
from .jwt import create_access_token, create_refresh_token
from .schemas import Token

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/login", response_model=Token)
async def login(user: str = Form(...), password: str = Form(...), session: AsyncSession = Depends(get_session)):
    user = await verify_login(login=user, password=password, session=session)
    return Token(access_token=create_access_token(id=user.id, username=user.username),
                 refresh_token=create_refresh_token(id=user.id, username=user.username))
