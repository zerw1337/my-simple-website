import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, WebSocketException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.dependencies import get_auth, get_auth_no_exception
from api.user_online_status.utils import update_last_seen_user_status
from api.ws.config import ws_online, ws_online_unauthorized
from src.models.database import get_session

user_status_router = APIRouter(prefix="/status", tags=["user_status"])

@user_status_router.websocket("/ws/")
async def user_status_websocket(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
):
    token = websocket.query_params.get("token")

    try:
        user = await get_auth_no_exception(session=session, token=token)
    except Exception:
        user = None

    if user is not None:
        await ws_online.connect(websocket=websocket, user_id=user.id)
        await update_last_seen_user_status(user=user, session=session, new_value=None)
        await ws_online.broadcast(message_type="connected", user_id=user.id)

        try:
            while True:
                await websocket.receive_text()

        except (WebSocketDisconnect, RuntimeError, WebSocketException):
            pass

        finally:

            await ws_online.disconnect(websocket=websocket, user_id=user.id)
            if user.id not in ws_online.active_connections:
                await update_last_seen_user_status(user=user, session=session, new_value=datetime.now())
                await ws_online.broadcast(message_type="disconnected", user_id=user.id)
    else:
        await ws_online_unauthorized.connect(websocket=websocket)

        try:
            while True:
                await websocket.receive_text()

        except (WebSocketDisconnect, RuntimeError, WebSocketException):
            pass

        finally:
            await ws_online_unauthorized.disconnect(websocket=websocket)

