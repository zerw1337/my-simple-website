from typing import Sequence

from api.posts.schemas import PostOut
from src.models.models import Posts


def get_all_posts_dto(posts: Sequence[Posts]) -> list[PostOut]:
    result = []
    for post in posts:
        res = PostOut.model_validate(post)
        result.append(res)
    return result

def get_post_by_id_dto(post: Posts) -> PostOut:
    return PostOut.model_validate(post)