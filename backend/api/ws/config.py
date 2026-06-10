import asyncio

from fastapi import WebSocket
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth.schemas import UserOut
from src.models.models import Messages




class ConnectionManager:
    def __init__(self):
        self.messanger_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)
        self.active_connections_unauthorized: set[WebSocket] = set()

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

class OnlineStatusConnectionManager(ConnectionManager):
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id].add(websocket)

    async def broadcast(self, user_id: int, message_type: str):
        if message_type == "connected":
            for connections in self.active_connections.values():
                for ws in connections.copy():
                    try:
                        await ws.send_json({
                            "type": "connected",
                            "user_id": user_id,
                        })
                    except Exception:
                        connections.discard(ws)
            for ws in ws_online_unauthorized.active_connections_unauthorized.copy():
                try:
                    await ws.send_json({
                        "type": "connected",
                        "user_id": user_id,
                    })
                except Exception:
                    ws_online_unauthorized.active_connections_unauthorized.discard(ws)
        elif message_type == "disconnected":
            for connections in self.active_connections.values():
                for ws in connections.copy():
                    try:
                        await ws.send_json({
                            "type": "disconnected",
                            "user_id": user_id,
                        })
                    except Exception:
                        connections.discard(ws)
            for ws in ws_online_unauthorized.active_connections_unauthorized.copy():
                try:
                    await ws.send_json({
                        "type": "disconnected",
                        "user_id": user_id,
                    })
                except Exception:
                    ws_online_unauthorized.active_connections_unauthorized.discard(ws)

    async def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

class OnlineStatusUnauthorizedConnectionManager(ConnectionManager):
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections_unauthorized.add(websocket)


    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections_unauthorized:
            self.active_connections_unauthorized.discard(websocket)


ws_online = OnlineStatusConnectionManager()
ws_online_unauthorized = OnlineStatusUnauthorizedConnectionManager()
ws_messanger = MessangerConnectionManager()
