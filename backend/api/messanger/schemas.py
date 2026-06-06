from datetime import datetime
from pydantic import BaseModel, ConfigDict



class ChatList(BaseModel):
    id: int
    uuid: str
    last_message_id: int
    last_message_text: str
    last_message_created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChatListUser(BaseModel):
    id: int
    username: str
    last_read_message_id: int | None

class ChatListOut(BaseModel):
    chat: ChatList
    last_message_user: ChatListUser

class ChatOut(BaseModel):
    chat_id: int
    message: str
    created_at: datetime
    user : ChatListUser
