from fastapi import APIRouter, WebSocket, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_session

user_status_router = APIRouter(prefix="/status", tags=["user_status"])

@user_status_router.websocket("/ws/")
async def user_status_websocket(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
):
    pass