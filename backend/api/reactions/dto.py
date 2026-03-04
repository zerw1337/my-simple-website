from typing import Sequence

from src.models.models import Reactions
from .schemas import Reaction


def get_reactions_by_post_id_dto(reactions_orm: Sequence[Reactions]):
    result = []
    for reaction in reactions_orm:
        res = Reaction.model_validate(reaction)
        result.append(res)
    return result