from collections import defaultdict
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from api.alpha_features.utils import get_current_users_chat_uuids
from api.auth.schemas import UserOut
from api.messanger.utils import check_if_current_user_belongs_to_this_chat, upload_new_message_to_database


class MessangerConnectionManager:
    def __init__(self):
        self.connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.websocket_chats: dict[WebSocket, set[str]] = {}

    async def connect(self, websocket: WebSocket, user: UserOut, session: AsyncSession):
        await websocket.accept()

        try:
            chat_uuids = await get_current_users_chat_uuids(session=session, user=user)
        except Exception:
            await websocket.close(code=1011)
            return

        self.websocket_chats[websocket] = chat_uuids

        for uid in chat_uuids:
            self.connections[uid].add(websocket)


    async def disconnect(self, websocket: WebSocket):
        chat_uuids = self.websocket_chats.pop(websocket, set())

        for uid in chat_uuids:
            self.connections[uid].discard(websocket)

            if not self.connections[uid]:
                del self.connections[uid]

    async def broadcast(self, websocket: WebSocket, user: UserOut, session: AsyncSession, received: dict, chat_uuid: str):

        try:
            await check_if_current_user_belongs_to_this_chat(user=user, chat_uuid=chat_uuid, session=session)
        except Exception:
            await websocket.close(code=1011)
            return

        received_type = received["type"]

        if received_type == "new_message":
            message = received["message"]

            try:
                await upload_new_message_to_database(session=session, message=message, chat_uuid=chat_uuid, user=user)
            except Exception:
                await websocket.close(code=1011)
                return

            for ws in self.connections[chat_uuid].copy():
                try:
                    await ws.send_text(message)
                except Exception:
                    await self.disconnect(websocket)
                    await websocket.close(code=1011)
                    return





