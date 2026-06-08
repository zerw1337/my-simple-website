from fastapi import WebSocket
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.schemas import UserOut
from src.models.models import Messages




class ConnectionManager:
    def __init__(self):
        self.messanger_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user: UserOut):
        await websocket.accept()
        self.active_connections[user.id].add(websocket)

    async def disconnect(self, websocket: WebSocket, user: UserOut):
        if user.id in self.active_connections:
            self.active_connections[user.id].discard(websocket)

            if not self.active_connections[user.id]:
                del self.active_connections[user.id]

class MessangerConnectionManager(ConnectionManager):
    async def connect(self, websocket: WebSocket, chat_uuid: str):
        await websocket.accept()
        self.messanger_connections[chat_uuid].add(websocket)

    async def broadcast(self,
                        message: Messages,
                        chat_uuid: str,):
        payload = {
            "response_type": "message_created",
            "message_id": message.id,
            "user_id": message.user_id,
            "message": message.message,
            "created_at": message.created_at.isoformat(),
        }
        for connection in self.messanger_connections[chat_uuid].copy():
            try:
                await connection.send_json(payload)
            except Exception:
                self.messanger_connections[chat_uuid].discard(connection)

    async def broadcast_edit_message(self,
                           message: Messages,
                           chat_uuid: str,
                           ):
        payload = {
            "response_type": "message_edited",
            "message_id": message.id,
            "user_id": message.user_id,
            "message": message.message,
            "edited_at": message.created_at.isoformat(),
        }
        for connection in self.messanger_connections[chat_uuid].copy():
            try:
                await connection.send_json(payload)
            except Exception:
                self.messanger_connections[chat_uuid].discard(connection)

    async def broadcast_delete(self,
                               message_id: int,
                               chat_uuid: str,):
        payload = {
            "response_type": "message_deleted",
            "message_id": message_id,
        }
        for connection in self.messanger_connections[chat_uuid].copy():
            try:
                await connection.send_json(payload)
            except Exception:
                self.messanger_connections[chat_uuid].discard(connection)

    async def disconnect(self, websocket: WebSocket, chat_uuid: str):
        if chat_uuid in self.messanger_connections:
            self.messanger_connections[chat_uuid].discard(websocket)

            if not self.messanger_connections[chat_uuid]:
                del self.messanger_connections[chat_uuid]






ws_messanger = MessangerConnectionManager()
