from datetime import datetime
from pydantic import BaseModel, ConfigDict



class ChatList(BaseModel):
    id: int
    uuid: str
    last_message_id: int | None = None
    last_message_text: str | None = None
    last_message_created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class ChatListUser(BaseModel):
    id: int
    username: str
    last_read_message_id: int | None
    last_seen: datetime | None = None

class OtherParticipant(BaseModel):
    id: int
    username: str
    last_seen : datetime | None = None

class ChatListOut(BaseModel):
    chat: ChatList
    last_message_user: ChatListUser | None
    other_participant: OtherParticipant | None = None
    unread_count: int | None = None

class ChatOut(BaseModel):
    id: int
    chat_id: int
    message: str
    created_at: datetime
    user : ChatListUser
