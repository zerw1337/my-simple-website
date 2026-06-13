from src.models.models import Profiles
from .schemas import ProfileOut

def profile_dto(profile: Profiles, comments_count: int, posts_count: int) -> ProfileOut:
    res = ProfileOut(
        first_name=profile.first_name,
        last_name=profile.last_name,
        birthday=profile.birthday,
        bio=profile.bio,
        username=profile.user.username if profile.user else None,
        user_id=profile.user_id,
        last_seen=profile.last_seen,
        posts_count=posts_count,
        comments_count=comments_count,
    )
    return res