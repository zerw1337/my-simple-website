from pydantic import BaseModel, ConfigDict
from typing import ClassVar

from src.models.models import ReactionsEnum


class Reaction(BaseModel):
    user_id: int
    post_id: int
    reaction: ReactionsEnum

    model_config = ConfigDict(from_attributes=True)

class CreateReaction(BaseModel):
    reaction: ReactionsEnum

class ReactionEmojis:
    emojis: ClassVar[dict[str, str]] = {
        "CLOWN": "🤡",
        "LIKE": "❤️",
        "DISLIKE": "👎",
        "SMILE": "😊",
        "LAUGH": "🤣",
        "ANGRY": "😡",
        "SAD": "☹️",
        "FIRE": "🔥",
    }


