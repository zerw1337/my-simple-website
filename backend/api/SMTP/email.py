from aiosmtplib import SMTP
from email.message import EmailMessage
import ssl
from aiosmtplib.errors import SMTPException
from fastapi import HTTPException

from api.auth.schemas import UserOut
from api.registration.schemas import CreateUser
from src.config import settings

async def send_email(user: CreateUser | UserOut, subject: str, html: str):
    msg = EmailMessage()
    msg['From'] = settings.SMTP_USERNAME
    msg['Subject'] = subject
    msg['To'] = user.email
    msg.add_alternative(html, "html")

    smtp = SMTP(hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                use_tls=True,
                tls_context=ssl.create_default_context())

    try:
        await smtp.connect()
        await smtp.send_message(msg)

    except SMTPException:
        return {"status": "email_failed"}

    finally:
        try:
            await smtp.quit()
        except Exception:
            pass


    return True
