from datetime import datetime, timezone

from api.auth.schemas import UserOut

admin = UserOut(
    id=1,
    username="admin",
    email="admin@mail.ru",
    created_at=datetime.now(timezone.utc),
    is_active=True,
    is_banned=False,
    is_superuser=True,
    is_verified=True,
    user_version=1,
    pending_email=None
)

user = UserOut(
    id=2,
    username="user",
    email="321@mail.ru",
    created_at=datetime.now(timezone.utc),
    is_active=True,
    is_banned=False,
    is_superuser=False,
    is_verified=True,
    user_version=1,
    pending_email=None
)

new_user = UserOut(
    id=3,
    username="new_user",
    email="456@mail.ru",
    created_at=datetime.now(timezone.utc),
    is_active=True,
    is_banned=False,
    is_superuser=False,
    is_verified=False,
    user_version=1,
    pending_email=None
)