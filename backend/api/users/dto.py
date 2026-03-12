from api.auth.schemas import UserOut
from src.models.models import Users


def get_all_users_list_dto(users: list[Users]) -> list[UserOut]:
    result = []
    for user in users:
        res = UserOut.model_validate(user)
        result.append(res)
    return result