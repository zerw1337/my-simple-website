from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from api.auth.auth_validation import get_current_user
from src.models.database import get_session
from api.auth.views import oauth2_scheme
from api.auth.schemas import UserOut

async def get_auth(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> UserOut:
    user = await get_current_user(token=token, session=session)
    return user