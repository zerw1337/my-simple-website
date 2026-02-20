from fastapi import APIRouter, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.models import Users
from .utils import create_user
from src.models.database import get_session

register_router = APIRouter(prefix="/register", tags=["Registration"])

@register_router.post("/register")
async def register(username: str = Form(), email: str = Form(), password: str = Form(), session: AsyncSession = Depends(get_session)):
    await create_user(username, email, password, session)
    return {"success": True}
