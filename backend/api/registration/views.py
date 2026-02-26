from fastapi import APIRouter, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr, ValidationError

from .schemas import CreateUser, CreateProfile
from .utils import create_new_user, create_new_profile
from src.models.database import get_session
from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut

register_router = APIRouter(prefix="/register", tags=["Registration"])

@register_router.post("/")
async def register(username: str = Form(), email: EmailStr = Form(), password: str = Form(), session: AsyncSession = Depends(get_session)):
    try:
        user = CreateUser(username=username, email=email, password=password)
    except ValidationError as e:
        detail = str(e)
        raise HTTPException(status_code=422, detail=detail)
    return await create_new_user(user, session)

@register_router.post("/create_profile/")
async def create_profile(new_profile: CreateProfile, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await create_new_profile(profile=new_profile, user=user, session=session)
    return {"success": True}
