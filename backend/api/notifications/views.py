from fastapi import APIRouter, Depends, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth_admin, get_auth
from api.auth.schemas import UserOut
from api.notifications.crud import create_custom_notification_process, get_my_notifications
from api.notifications.schemas import CreateNotification
from src.models.database import get_session


notification_router = APIRouter(prefix="/notifications", tags=["notifications"])





@notification_router.post("/custom/")
async def create_notification(new_notification: CreateNotification, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    await create_custom_notification_process(new_notification=new_notification, session=session)
    return {"message": "success"}

@notification_router.get("/")
async def get_notifications(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await get_my_notifications(user=user, session=session)

@notification_router.patch("/check/{notification_id}/")
async def check_notification(notification_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    pass