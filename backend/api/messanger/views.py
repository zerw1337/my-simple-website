from fastapi import APIRouter, Depends, WebSocket, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect

from api.auth.dependencies import get_auth
from api.auth.schemas import UserOut
from api.messanger.utils import create_new_chat, get_all_my_chats, get_chat_by_uuid, \
    check_if_current_user_belongs_to_this_chat, upload_new_message_to_database, edit_message, delete_message, \
    update_last_read_message_for_participant
from api.ws.config import ws_messanger
from src.models.database import get_session

messanger_router = APIRouter(prefix="/chats", tags=["Chats"])

@messanger_router.post("/{user_id}")
async def create_chat(user_id: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    result = await create_new_chat(user_id=user_id, session=session, user=user)
    return result

@messanger_router.get("/my/")
async def get_my_chats(user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await get_all_my_chats(user=user, session=session)

@messanger_router.get("/{chat_uuid}")
async def get_chat(chat_uuid: str, session: AsyncSession = Depends(get_session), user: UserOut = Depends(get_auth)):
    return await get_chat_by_uuid(chat_uuid=chat_uuid, session=session, user=user)

@messanger_router.websocket("/{chat_uuid}/ws/")
async def chat_ws(chat_uuid: str, websocket: WebSocket, session: AsyncSession = Depends(get_session)):
    token = websocket.query_params.get("token")
    if token:
        user = await get_auth(session=session, token=token)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    await check_if_current_user_belongs_to_this_chat(chat_uuid=chat_uuid, session=session, user=user)
    await ws_messanger.connect(websocket=websocket, chat_uuid=chat_uuid)
    try:
        while True:

            received = await websocket.receive_json()
            received_type = received["type"]

            if received_type == "new_message":
                received_data = received["message"]
                message_orm = await upload_new_message_to_database(message=received_data, chat_uuid=chat_uuid, session=session, user=user)
                if len(ws_messanger.messanger_connections[chat_uuid]) > 1 :
                    await update_last_read_message_for_participant(message=message_orm, session=session, user=user)
                await ws_messanger.broadcast(message=message_orm, chat_uuid=chat_uuid)

            elif received_type == "edit_message":
                received_message_id = received["message_id"]
                received_data = received["message"]
                message_orm = await edit_message(user=user, message_id=received_message_id, message=received_data, session=session)
                await ws_messanger.broadcast_edit_message(message=message_orm, chat_uuid=chat_uuid)

            elif received_type == "delete_message":
                received_message_id = received["message_id"]
                deleted_message_id = await delete_message(message_id=received_message_id, session=session, user=user)
                await ws_messanger.broadcast_delete(message_id=deleted_message_id, chat_uuid=chat_uuid)

            elif received_type == "ping":
                await websocket.send_json({"type": "pong"})


    except WebSocketDisconnect:
        await ws_messanger.disconnect(chat_uuid=chat_uuid, websocket=websocket)

    except Exception:
        await ws_messanger.disconnect(chat_uuid=chat_uuid, websocket=websocket)
