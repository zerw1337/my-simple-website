from fastapi import APIRouter, Form, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr, ValidationError


from src.models.models import VerifyCodesEnum
from .schemas import CreateUser, CreateProfile
from .utils import create_new_user, create_new_profile, upload_verify_code_to_database, verify_new_user_via_code, \
    check_if_current_users_verify_code_exists
from src.models.database import get_session
from api.auth.dependencies import get_auth, get_auth_new_user, get_auth_unauthorized
from api.auth.schemas import UserOut
from api.SMTP.utils import generate_verify_code, generate_html_verify_message_for_registration
from api.SMTP.email import send_email
from api.auth.schemas import Token
from api.auth.jwt import create_access_token, create_refresh_token
from ..auth.token_database_operations import submit_refresh_token
from ..rate_limiter.limiter import is_limited_smtp_service

register_router = APIRouter(prefix="/register", tags=["Registration"])

@register_router.post("/", response_model=Token, summary="Регистрация, при успешной регистрации -> access refresh tokens")
async def register(background_tasks : BackgroundTasks, user: UserOut = Depends(get_auth_unauthorized), username: str = Form(), email: EmailStr = Form(), password: str = Form(), session: AsyncSession = Depends(get_session)):
    try:
        user = CreateUser(username=username, email=email, password=password)
    except ValidationError as e:
        detail = str(e)
        raise HTTPException(status_code=422, detail=detail)
    new_user = await create_new_user(user, session)
    code = generate_verify_code()
    await upload_verify_code_to_database(code=code, code_type=VerifyCodesEnum.registration, user=new_user, session=session)
    html = generate_html_verify_message_for_registration(code=code, user=new_user)
    background_tasks.add_task(send_email, user=new_user, subject="Verification code", html=html)
    access_token = create_access_token(id=new_user.id, username=new_user.username, user_version=new_user.user_version, user=new_user)
    refresh_token = create_refresh_token(id=new_user.id, username=new_user.username, user_version=new_user.user_version, user=new_user)
    await submit_refresh_token(token=refresh_token, session=session)
    return Token(access_token=access_token, refresh_token=refresh_token, user=new_user.username)

@register_router.post("/create_profile/", summary="Создать профиль")
async def create_profile(new_profile: CreateProfile, user: UserOut = Depends(get_auth), session: AsyncSession = Depends(get_session)):
    await create_new_profile(profile=new_profile, user=user, session=session)
    return {"success": True}

@register_router.post("/verify/", summary="Подтвердить is_verified по коду из имейл")
async def verify_registration(code: int, user: UserOut = Depends(get_auth_new_user), session: AsyncSession = Depends(get_session)):
    await verify_new_user_via_code(code=code, user=user, session=session)
    return {"status": f"Account {user.username} successfully verified"}

@register_router.post("/verify/resend_code/", summary="Отправить письмо с кодом для подтверждения учетки еще раз")
async def resend_verify_code_for_registration(request: Request, background_tasks: BackgroundTasks, user: UserOut = Depends(get_auth_new_user), session: AsyncSession = Depends(get_session)):
    if await is_limited_smtp_service(ip=request.client.host):
        raise HTTPException(status_code=429, detail="Your limit for sending emails per day has been reached")
    await check_if_current_users_verify_code_exists(code_type=VerifyCodesEnum.registration, user=user, session=session)
    code = generate_verify_code()
    await upload_verify_code_to_database(code=code, code_type=VerifyCodesEnum.registration, user=user, session=session)
    html = generate_html_verify_message_for_registration(code=code, user=user)
    background_tasks.add_task(send_email, user=user, subject="Verification code", html=html)
    return {"Status": "User registered, verification code sent."}



