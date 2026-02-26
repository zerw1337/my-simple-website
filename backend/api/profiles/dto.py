from src.models.models import Profiles
from .schemas import ProfileOut

def profile_dto(profile: Profiles) -> ProfileOut:
    return ProfileOut.model_validate(profile)