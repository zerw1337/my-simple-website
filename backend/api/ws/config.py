from fastapi import WebSocket
from collections import defaultdict

from api.auth.schemas import UserOut




class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user: UserOut):
        await websocket.accept()
        self.active_connections[user.id].add(websocket)

    async def disconnect(self, websocket: WebSocket, user: UserOut):
        if user.id in self.active_connections:
            self.active_connections[user.id].discard(websocket)

            if not self.active_connections[user.id]:
                del self.active_connections[user.id]