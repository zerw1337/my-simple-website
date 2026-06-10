from dis import RETURN_CONST

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from api.auth.auth_validation import get_current_user
from src.models.database import get_session
from api.auth.views import oauth2_scheme, oauth2_scheme_unauthorized
from api.auth.schemas import UserOut

async def get_auth(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> UserOut:
    user = await get_current_user(token=token, session=session)
    if user.is_verified and user.is_active and not user.is_banned:
        return user
    else: raise HTTPException(status_code=403, detail="Forbidden")

async def get_auth_new_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> UserOut:
    user = await get_current_user(token=token, session=session)
    if not user.is_verified and user.is_active and not user.is_banned:
        return user
    else: raise HTTPException(status_code=403, detail="Forbidden")

async def get_auth_admin(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> UserOut:
    user = await get_current_user(token=token, session=session)
    if user.is_verified and user.is_active and not user.is_banned:
        if user.is_superuser:
            return user
        raise HTTPException(status_code=403, detail="Forbidden")
    else: raise HTTPException(status_code=403, detail="Forbidden")

async def get_auth_unauthorized(token: str | None = Depends(oauth2_scheme_unauthorized), session: AsyncSession = Depends(get_session)) -> bool:
    if token:
        user = await get_current_user(token=token, session=session)
        if user:
            raise HTTPException(status_code=403, detail="Forbidden")
    return True

async def get_auth_no_exception(token: str | None, session: AsyncSession = Depends(get_session)) -> UserOut | None:
    if token is None:
        return None
    user = await get_current_user(token=token, session=session)
    if user.is_verified and user.is_active and not user.is_banned:
        return user
    return None
