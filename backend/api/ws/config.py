from fastapi import WebSocket
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from websockets import WebSocketException

from api.auth.schemas import UserOut
from api.notifications.crud import create_new_post_notification, create_notification_body, \
    create_new_comment_notification, create_new_message_notification, read_current_notification, \
    read_current_users_all_notifications, delete_current_notification, delete_current_users_all_notifications, \
    create_custom_notification_process
from api.notifications.schemas import NotificationsListOut, CreateNotification
from src.models.models import Messages




class ConnectionManager:
    def __init__(self):
        self.messanger_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)
        self.active_connections_unauthorized: set[WebSocket] = set()
        self.notify_connections: dict[int, set[WebSocket]] = defaultdict(set)

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
        await websocket.send_json({
            "type": "online_users",
            "users": list(ws_online.active_connections.keys()),
        })


    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections_unauthorized:
            self.active_connections_unauthorized.discard(websocket)

class NotificationsConnectionManager(ConnectionManager):


    async def connect(self, websocket: WebSocket, user_id: int, user_notifications: NotificationsListOut):
        await websocket.accept()
        self.notify_connections[user_id].add(websocket)
        await websocket.send_json({
            "type": "connected",
            "notifications": user_notifications,
        })



    async def broadcast(self, user_id: int, message: dict, session: AsyncSession, user: UserOut, websocket: WebSocket):
        message_type = message.get("type")


        if message_type == "new_post":

            notif = create_notification_body(
                notif_type=message_type,
                post_id=message.get("post_id"),
                chat_uuid=None,
            )


            await create_new_post_notification(notif, session)

            for connection in self.notify_connections.values():
                for ws in connection.copy():
                    try:
                        await ws.send_json({
                            "type": message_type,
                            "notification": notif.model_dump(),
                        })
                    except WebSocketException:
                        connection.discard(ws)

        elif message_type == "new_comment":

            notif = create_notification_body(
                notif_type=message_type,
                post_id=message.get("post_id"),
                chat_uuid=None,
            )


            ids = await create_new_comment_notification(new_notification=notif, session=session, current_user_id=user_id, post_id=message.get("post_id"))

            for target_user_id in ids:
                for ws in self.notify_connections.get(target_user_id, set()).copy():
                    try:
                        await ws.send_json({
                            "type": message_type,
                            "notification": notif.model_dump(),
                        })
                    except WebSocketException:
                        self.notify_connections[target_user_id].discard(ws)


        elif message_type == "new_message":
            notif = create_notification_body(
                notif_type=message_type,
                post_id=None,
                chat_uuid=message.get("chat_uuid"),
            )

            await create_new_message_notification(new_notification=notif, user_id=message.get("participant_id"), session=session)

            for ws in self.notify_connections.get(message.get("participant_id"), set()).copy():
                try:
                    await ws.send_json({
                        "type": message_type,
                        "notification": notif.model_dump(),
                    })
                except WebSocketException:
                    self.notify_connections[message.get("participant_id")].discard(ws)

        elif message_type == "read_current_notification":

            await read_current_notification(session=session, notification_id=message.get("notification_id"), user=user)

            for ws in self.notify_connections.get(user_id, set()).copy():
                try:
                    await ws.send_json({
                        "type": message_type,
                        "notification_id": message.get("notification_id"),
                        "status": "Success"
                    })
                except WebSocketException:
                    self.notify_connections[user_id].discard(ws)

        elif message_type == "read_all_notifications":

            await read_current_users_all_notifications(session=session, user=user)

            for ws in self.notify_connections.get(user_id, set()).copy():
                try:
                    await ws.send_json({
                        "type": message_type,
                        "status": "Success"
                    })
                except WebSocketException:
                    self.notify_connections[user_id].discard(ws)

        elif message_type == "delete_current_notification":
            await delete_current_notification(session=session, notification_id=message.get("notification_id"), user=user)

            for ws in self.notify_connections.get(user_id, set()).copy():
                try:
                    await ws.send_json({
                        "type": message_type,
                        "notification_id": message.get("notification_id"),
                        "status": "Success"
                    })
                except WebSocketException:
                    self.notify_connections[user_id].discard(ws)

        elif message_type == "delete_all_notifications":

            await delete_current_users_all_notifications(session=session, user=user)

            for ws in self.notify_connections.get(user_id, set()).copy():
                try:
                    await ws.send_json({
                        "type": message_type,
                        "status": "Success"
                    })
                except WebSocketException:
                    self.notify_connections[user_id].discard(ws)

        elif message_type == "create_custom_notification":
            if not user.is_superuser:
                await websocket.close(code=1008)
                return

            notif = CreateNotification(
                title=message.get("title"),
                body=message.get("body"),
                refer_to=message.get("refer_to"),
            )

            await create_custom_notification_process(new_notification=notif, session=session)

            for connection in self.notify_connections.values():
                for ws in connection.copy():
                    try:
                        await ws.send_json({
                            "type": message_type,
                            "notification": notif.model_dump(),
                        })
                    except WebSocketException:
                        connection.discard(ws)



    async def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.notify_connections:
            self.notify_connections[user_id].discard(websocket)
            if not self.notify_connections[user_id]:
                del self.notify_connections[user_id]



ws_notifications = NotificationsConnectionManager()
ws_online = OnlineStatusConnectionManager()
ws_online_unauthorized = OnlineStatusUnauthorizedConnectionManager()
ws_messanger = MessangerConnectionManager()
