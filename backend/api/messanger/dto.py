from typing import Sequence

from api.messanger.schemas import ChatList, ChatListUser, ChatListOut, ChatOut, OtherParticipant
from src.models.models import Chats, Messages


def chats_list_dto(chats: Sequence[Chats], current_user_id: int) -> list[ChatListOut]:
    result = []
    for chat in chats:
        last_user = None
        if chat.last_message:
            last_user = ChatListUser(
                id=chat.last_message.user.id,
                username=chat.last_message.user.username,
                last_read_message_id=None,
            )

        other = None
        for p in chat.participants:
            if p.user_id != current_user_id:
                other = OtherParticipant(id=p.user_id, username=p.username)
                break

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
                other_participant=other,
            )
        )
    return result


def get_chat_by_uuid_dto(messages: Sequence[Messages]) -> list[ChatOut]:
    result = []
    for message in messages:
        user = ChatListUser(
            id=message.user.id,
            username=message.user.username,
            last_read_message_id=None,
        )
        res = ChatOut(
            id=message.id,
            chat_id=message.chat_id,
            message=message.message,
            created_at=message.created_at,
            user=user,
        )
        result.append(res)
    return result