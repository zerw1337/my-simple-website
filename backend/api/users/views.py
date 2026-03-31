from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr
import json
from redis.asyncio import Redis

from api.auth.schemas import UserOut
from api.auth.dependencies import get_auth, get_auth_admin
from src.models.database import get_session
from src.models.models import VerifyCodesEnum
from .crud import change_current_user_password, change_current_user_pending_email, \
    check_if_current_user_has_pending_email, get_all_users_list, ban_current_user, unban_current_user
from api.SMTP.email import send_email
from api.SMTP.utils import generate_verify_code, generate_html_verify_message_for_manage_account
from .dto import get_all_users_list_dto
from ..auth.auth_validation import get_current_user
from ..auth.views import oauth2_scheme
from ..registration.utils import upload_verify_code_to_database, verify_email_change_via_code, \
    check_if_current_users_verify_code_exists
from src.redis.dependencies import get_cache
from src.config import settings
from api.users.schemas import ChangePassword

users_router = APIRouter(prefix="/user", tags=["Users"])

@users_router.get("/me/")
async def get_me(user: UserOut = Depends(get_auth)):
    return user

@users_router.get("/get_all_users/")
async def get_all_users(user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r:Redis = Depends(get_cache)):
    cached = await r.get("all_users")
    if cached:
        return json.loads(cached)
    users_orm = await get_all_users_list(session=session)
    users_dto = get_all_users_list_dto(users_orm)
    await r.set("all_users", json.dumps([u.model_dump(mode="json") for u in users_dto]), ex=settings.CACHE_EXPIRE)
    return users_dto

@users_router.post("/ban/")
async def ban_user(user_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r:Redis = Depends(get_cache)):
    await ban_current_user(user_id=user_id, session=session)
    await r.delete("all_users")
    return {"success": True}

@users_router.post("/unban/")
async def unban_user(user_id: int, user: UserOut = Depends(get_auth_admin), session: AsyncSession = Depends(get_session), r:Redis = Depends(get_cache)):
    await unban_current_user(user_id=user_id, session=session)
    await r.delete("all_users")
    return {"success": True}

@users_router.patch("/settings/change_password/")
async def change_password(body: ChangePassword, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    return await change_current_user_password(new_password=body.new_password, in_user=user, session=session)
@users_router.patch("/settings/change_email/")
async def change_email(background_tasks: BackgroundTasks, new_email: EmailStr, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await change_current_user_pending_email(new_email=new_email, in_user=user, session=session)
    code = generate_verify_code()
    html = generate_html_verify_message_for_manage_account(code=code, username=user.username)
    await upload_verify_code_to_database(code=code, code_type=VerifyCodesEnum.manage_account, user=user, session=session)
    background_tasks.add_task(send_email, user=user, subject="Confirm recent email change", html=html)
    return {"status": "Request pending, email with confirmation code sent to your old email"}

@users_router.post("/settings/change_email/confirm/")
async def confirm_email_update(code: int, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await verify_email_change_via_code(code=code, user=user, session=session)
    return {"status": f"email successfully changed to {user.pending_email}"}

@users_router.post("/settings/change_email/resend_code/")
async def resend_verify_code_for_registration(background_tasks: BackgroundTasks, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await check_if_current_user_has_pending_email(user=user, session=session)
    await check_if_current_users_verify_code_exists(code_type=VerifyCodesEnum.manage_account, user=user, session=session)
    code = generate_verify_code()
    await upload_verify_code_to_database(code=code, code_type=VerifyCodesEnum.manage_account, user=user, session=session)
    html = generate_html_verify_message_for_manage_account(code=code, username=user.username)
    background_tasks.add_task(send_email, user=user, subject="Confirm recent email change", html=html)
    return {"Status": "Request pending, email with confirmation code sent to your old email"}