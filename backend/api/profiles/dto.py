from src.models.models import Profiles
from .schemas import ProfileOut

def profile_dto(profile: Profiles) -> ProfileOut:
    res = ProfileOut.model_validate(profile)
    res.username = profile.user.username if profile.user else None
    res.user_id = profile.user_id
    return res