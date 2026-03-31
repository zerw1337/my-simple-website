from typing import Sequence

from api.comments.schemas import Comment
from src.models.models import Comments


def get_all_comments_dto(comments: Sequence[Comments]) -> list[Comment]:
    result = []
    for comment in comments:
        res = Comment.model_validate(comment)
        result.append(res)
    return result

def get_comment_dto(comment: Comments) -> Comment:
    return Comment.model_validate(comment)