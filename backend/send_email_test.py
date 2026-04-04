import datetime

from api.SMTP.email import send_email
from api.auth.schemas import UserOut
from api.SMTP.utils import generate_html_verify_message_for_registration

email = input("email: ")

user = UserOut(
    id = 1,
    username = "test",
    email = email,
    is_active = True,
    is_banned= False,
    is_superuser= True,
    is_verified= False,
    user_version = 1,
    pending_email = None,
    created_at = datetime.datetime.now(),
    )

html = generate_html_verify_message_for_registration(code=123, username="test")



async def send_email_test(user_in: UserOut = user, subject: str = "hello", body: str = html):
    await send_email(user=user_in, subject=subject, html=body)
    return print("finished")