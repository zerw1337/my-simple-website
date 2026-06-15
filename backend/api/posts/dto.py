from typing import Sequence

from sqlalchemy.testing.pickleable import User

from api.categories.schemas import Category
from api.posts.schemas import PostOut
from src.models.models import Posts
from api.auth.schemas import UserOut


def get_all_posts_dto(posts: Sequence[Posts]) -> list[PostOut]:
    result = []
    for post in posts:
        res = PostOut.model_validate(post)
        result.append(res)
    return result

def get_post_by_id_dto(post: Posts, previous_post_id: int | None = None, next_post_id: int | None = None) -> PostOut:
    category = Category(
        id=post.category.id,
        name=post.category.name,
        emoji=post.category.emoji,
        description=post.category.description,
    )
    user = UserOut(
        id=post.user.id,
        username=post.user.username,
        email=post.user.email,
        created_at=post.user.created_at,
        is_active=post.user.is_active,
        is_banned=post.user.is_banned,
        is_superuser=post.user.is_superuser,
        is_verified=post.user.is_verified,
        user_version=post.user.user_version,
        pending_email=None,
        last_seen=post.user.last_seen,
    )
    post_dto = PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        category=category,
        user=user,
        created_at=post.created_at,
        updated_at=post.updated_at,
        views=post.views,
        rating=post.rating,
        next_post_id=next_post_id,
        previous_post_id=previous_post_id,
    )
    return post_dto