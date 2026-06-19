from fastapi import APIRouter, Depends, Depends, HTTPException, WebSocketException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocket, WebSocketDisconnect

from api.auth.dependencies import get_auth_admin, get_auth
from api.auth.schemas import UserOut
from api.notifications.crud import create_custom_notification_process, get_my_notifications, read_current_notification, \
    read_current_users_all_notifications, delete_current_notification, delete_current_users_all_notifications, \
    create_welcome_notification_process, get_welcome_notification_process, delete_current_welcome_notification
from api.notifications.schemas import CreateNotification, CreateWelcomeNotification
from api.ws.config import ws_notifications
from src.models.database import get_session


notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])





@notification_router.post("/custom/")
async def create_notification(new_notification: CreateNotification, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    await create_custom_notification_process(new_notification=new_notification, session=session)
    await ws_notifications.broadcast_to_all("create_custom_notification", new_notification)
    return {"message": "success"}

@notification_router.post("/custom/welcome/")
async def create_welcome_notification(new_notification: CreateWelcomeNotification, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    await create_welcome_notification_process(new_notification=new_notification, session=session)
    return {"message": "success"}

@notification_router.get("/")
async def get_notifications(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await get_my_notifications(user=user, session=session)

@notification_router.get("/welcome/")
async def get_welcome_notification(session: AsyncSession = Depends(get_session)):
    notif = await get_welcome_notification_process(session=session)
    return notif

@notification_router.patch("/read/all/")
async def read_all_notifications(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await read_current_users_all_notifications(user=user, session=session)
    return {"message": "success"}

@notification_router.patch("/read/{notification_id}/")
async def read_notification(notification_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await read_current_notification(notification_id=notification_id, user=user, session=session)
    return {"message": "success"}

@notification_router.delete("/delete/all/")
async def delete_all_notifications(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await delete_current_users_all_notifications(user=user, session=session)
    return {"message": "success"}


@notification_router.delete("/delete/welcome/{notification_id}/")
async def delete_welcome_notification(notification_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session)):
    await delete_current_welcome_notification(notification_id=notification_id, user=user, session=session)
    return {"message": "success"}

@notification_router.delete("/delete/{notification_id}/")
async def delete_notification(notification_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await delete_current_notification(notification_id=notification_id, session=session, user=user)
    return {"message": "success"}


@notification_router.websocket("/ws/")
async def notifications_websocket(websocket: WebSocket, session: AsyncSession = Depends(get_session)):

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        user = await get_auth(token=token, session=session)
    except Exception:
        await websocket.close(code=1008)
        return

    user_notifications = await get_my_notifications(user=user, session=session)
    await ws_notifications.connect(user_id=user.id, websocket=websocket, user_notifications=user_notifications)

    try:
        while True:
            message = await websocket.receive_json()

            await ws_notifications.broadcast(
                message=message,
                websocket=websocket,
                user_id=user.id,
                user=user,
                session=session,
            )

    except WebSocketDisconnect:
        pass

    finally:
        await ws_notifications.disconnect(user_id=user.id, websocket=websocket)