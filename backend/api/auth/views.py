from fastapi import APIRouter, Form, Depends,  HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.utils import login_username_validate
from src.models.database import get_session

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/login")
async def login(user: str = Form(...), password: str = Form(...), session: AsyncSession = Depends(get_session)):
    await login_username_validate(login=user, password=password, session=session)
    return {"message": "success"}
