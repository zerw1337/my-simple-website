from typing import Sequence

from api.messanger.schemas import ChatList, ChatListUser, ChatListOut, ChatOut
from src.models.models import Chats, Messages


def chats_list_dto(chats: Sequence[Chats]) -> list[ChatListOut]:
    result = []
    for chat in chats:
        last_user = None
        if chat.last_message:
            last_user = ChatListUser(
                id=chat.last_message.user.id,
                username=chat.last_message.user.username,
                last_read_message_id=None,
            )
        result.append(
            ChatListOut(
                chat=ChatList(
                    id=chat.id,
                    uuid=chat.uuid,
                    last_message_id=chat.last_message_id,
                    last_message_created_at=chat.last_message_created_at,
                    last_message_text=chat.last_message_text,
                ),
                last_message_user=last_user,
            )
        )
    return result

def get_chat_by_uuid_dto(messages: Sequence[Messages]) -> list[ChatOut]:
    result = []
    for message in messages:
        user = ChatListUser(
            id=message.user.id,
            username=message.user.username,
            last_read_message_id=None
        )
        res = ChatOut(
            chat_id=message.chat_id,
            message=message.message,
            created_at=message.created_at,
            user=user,
        )
        result.append(res)
    return result