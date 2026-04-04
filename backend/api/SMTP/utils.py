from random import randint
import uuid

from api.auth.schemas import UserOut
from api.registration.schemas import CreateUser
from src.models.models import Users


def generate_verify_code() -> int:
    return randint(100000, 999999)

def generate_password_reset_url() -> str:
    url = uuid.uuid4().hex
    return url

def generate_html_verify_message_for_registration(code: int, user: UserOut | CreateUser) -> str:
    result = f"""
<html>
  <body style="background-color: #1f1f1f; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 50px auto; background-color: #2a2a2a; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="color: #04c6e9; margin-bottom: 20px;">Привет {user.username}, спасибо за регистрацию!</h1>
      <p style="color: #ececec; font-size: 18px; margin-bottom: 30px;">
        Вот твой код подтверждения: <b>{code}</b>
      </p>
      <a href="https://zerw1337.ru/profile/{user.id}" 
         style="display: inline-block; background-color: #04c6e9; color: #1f1f1f; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">
        Перейти на сайт
      </a>
    </div>
  </body>
</html>
"""
    return result

def generate_html_verify_message_for_manage_account(code: int, user: UserOut | CreateUser) -> str:
    result = f"""
<html>
  <body style="background-color: #1f1f1f; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 50px auto; background-color: #2a2a2a; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="color: #04c6e9; margin-bottom: 20px;">Привет {user.username}, изменение email.</h1>
      <p style="color: #ececec; font-size: 18px; margin-bottom: 30px;">
        Вот твой код подтверждения: <b>{code}</b>
      </p>
      <a href="https://zerw1337.ru/" 
         style="display: inline-block; background-color: #04c6e9; color: #1f1f1f; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">
        Перейти на сайт
      </a>
    </div>
  </body>
</html>
"""
    return result

def generate_html_verify_message_for_password_change(password_reset_url: str, user: UserOut | CreateUser | Users) -> str:
    result = f"""
<html>
  <body style="background-color: #1f1f1f; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 50px auto; background-color: #2a2a2a; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="color: #04c6e9; margin-bottom: 20px;">Привет {user.username}, изменение пароля.</h1>
      <p style="color: #ececec; font-size: 18px; margin-bottom: 30px;">
        Для завершения ищменения пароля, перейдите по одноразовой ссылке https://zerw1337.ru/reset-password/{password_reset_url}/
      </p>
    </div>
  </body>
</html>
"""
    return result