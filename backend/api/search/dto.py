from typing import Sequence

from api.search.schemas import PostSearch, CategorySearch, UserSearch
from src.models.models import Posts, Categories, Users


def search_posts_dto(posts: Sequence[Posts]) -> list[PostSearch]:
    result = []
    for post in posts:
        res = PostSearch.model_validate(post)
        result.append(res)
    return result

def search_categories_dto(cats: Sequence[Categories]) -> list[CategorySearch]:
    result = []
    for cat in cats:
        res = CategorySearch.model_validate(cat)
        result.append(res)
    return result

def search_users_dto(users: Sequence[Users]) -> list[UserSearch]:
    result = []
    for user in users:
        res = UserSearch.model_validate(user)
        result.append(res)
    return result